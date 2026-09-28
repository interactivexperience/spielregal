"""Ein Durchlauf: alle Quellen abfragen, neue Treffer pushen, Zustand speichern.

Aufruf:  python -m wohnungsalarm.run [--dry-run] [--state state.json]
Env:     NTFY_TOPIC (Pflicht außer bei --dry-run)
"""
import argparse
import hashlib
import os
import sys
import traceback
from datetime import timedelta
from zoneinfo import ZoneInfo

from . import criteria, notify
from .sources import LIST_SOURCES, WATCHES, SourceError
from .state import State, iso, now, parse_iso

MAX_PUSHES_PER_RUN = 15
MAX_DETAILS_PER_SOURCE = 12
FAIL_ALERT_AFTER = 4                 # Fehlläufe in Folge (~2 h) bis zur Warnung
FAIL_REALERT = timedelta(hours=24)
TZ = ZoneInfo("Europe/Berlin")


def log(*a):
    print(*a, flush=True)


class Run:
    def __init__(self, state: State, topic: str, dry: bool):
        self.st, self.topic, self.dry = state, topic, dry
        self.pushes = 0
        self.stats = {"geprueft": 0, "neu": 0, "treffer": 0}

    # ------------------------------------------------------------------ Health
    def ok(self, name: str) -> None:
        h = self.st.health.setdefault(name, {})
        if h.get("fails", 0) >= FAIL_ALERT_AFTER and h.get("alerted"):
            notify.system(self.topic, f"✅ {name} läuft wieder", "Die Quelle liefert wieder Ergebnisse.", self.dry, 2)
        if h.get("fails") or h.get("alerted") or "error" in h:
            h.update(fails=0, alerted=None)
            h.pop("error", None)
        last = parse_iso(h.get("last_ok"))
        if not last or now() - last > timedelta(hours=12):  # nicht jeden Lauf committen
            h["last_ok"] = iso(now())

    def fail(self, name: str, err: str) -> None:
        h = self.st.health.setdefault(name, {})
        h["fails"] = h.get("fails", 0) + 1
        h["error"] = err[:200]
        log(f"  ✗ {name}: {err} (Fehlversuch {h['fails']})")
        alerted = parse_iso(h.get("alerted"))
        if h["fails"] >= FAIL_ALERT_AFTER and (not alerted or now() - alerted > FAIL_REALERT):
            notify.system(self.topic, f"⚠️ Quelle ausgefallen: {name}",
                          f"Seit {h['fails']} Läufen keine Daten.\nFehler: {err}\n"
                          "Bis zur Reparatur hier nichts verpassen: Portal-Suchauftrag nutzen.", self.dry, 3)
            h["alerted"] = iso(now())

    # ------------------------------------------------------------------ Listen
    def push(self, l, v) -> bool:
        if self.pushes >= MAX_PUSHES_PER_RUN:
            return False
        notify.send(self.topic, notify.format_message(l, v), self.dry)
        self.pushes += 1
        return True

    def process_source(self, src) -> None:
        key = f"{src.name} ({src.kind})"
        log(f"▶ {key}")
        try:
            items = src.listings()
        except SourceError as e:
            return self.fail(key, str(e))
        except Exception as e:  # Parser-Bug o.ä. – nicht den ganzen Lauf abbrechen
            traceback.print_exc()
            return self.fail(key, f"{type(e).__name__}: {e}")
        if not items and src.expect_nonempty:
            return self.fail(key, "0 Anzeigen gefunden (Seitenstruktur geändert?)")
        self.ok(key)

        prefix = f"{src.name}|{src.kind}"
        first_run = not self.st.source_known(prefix)
        details = 0
        seed_hits = []
        for l in items:
            self.stats["geprueft"] += 1
            sid = f"{prefix}:{l.id}"
            prev = self.st.seen.get(sid)
            v = criteria.evaluate(l)
            # Detailseite nur für neue Kandidaten (spart Requests, schont die Seiten)
            maybe = v.status != "raus" or (v.cost_estimated and l.kalt and
                                           l.kalt <= criteria.MIETE_WARM_MAX * (1 + criteria.TOLERANZ))
            if prev is None and maybe and details < MAX_DETAILS_PER_SOURCE and src.has_detail:
                try:
                    src.detail(l)
                    details += 1
                    v = criteria.evaluate(l)
                except SourceError as e:
                    log(f"    Detail fehlgeschlagen ({e}) – bewerte nur Kartendaten")
                except Exception:
                    traceback.print_exc()
            notifiable = v.status in ("treffer", "knapp") or (v.status == "unklar" and src.notify_unclear)
            log(f"    {v.status:8} {'★' * v.stars:4} {l.title[:70]!r} {v.reasons or ''}")

            if prev is None:
                self.stats["neu"] += 1
                entry = {"first": iso(now()), "last": iso(now()), "status": v.status, "cost": v.cost}
                if notifiable:
                    self.stats["treffer"] += 1
                    if first_run:
                        seed_hits.append((l, v))
                        entry["notified"] = False
                    else:
                        entry["notified"] = self.push(l, v)
                self.st.seen[sid] = entry
            else:
                # Preissenkung: vorher raus/knapp, jetzt besser -> erneut melden
                better = (prev.get("status") in ("raus", "knapp") and v.status == "treffer") or \
                         (prev.get("status") == "raus" and v.status == "knapp")
                if better and not prev.get("notified_better"):
                    l.title = "Preis gesenkt: " + l.title
                    if self.push(l, v):
                        prev["notified_better"] = True
                    self.stats["treffer"] += 1
                if not prev.get("notified") and notifiable and not first_run and prev.get("status") != "raus":
                    prev["notified"] = self.push(l, v)  # beim letzten Mal wegen Limit übersprungen
                prev["status"], prev["cost"] = v.status, v.cost
                last = parse_iso(prev.get("last"))
                if not last or now() - last > timedelta(days=1):
                    prev["last"] = iso(now())

        if first_run:
            seed_hits.sort(key=lambda x: (x[1].status != "treffer", -x[1].stars))
            lines = [f"{'🏠' if v.status == 'treffer' else '🟡'} {'★' * v.stars} {l.title[:60]}\n   {l.url}"
                     for l, v in seed_hits[:8]]
            msg = (f"{len(items)} aktuelle Anzeigen erfasst, {len(seed_hits)} passen.\n" + "\n".join(lines)
                   if seed_hits else f"{len(items)} aktuelle Anzeigen erfasst, aktuell passt keine. Ab jetzt kommen nur neue.")
            notify.system(self.topic, f"🚀 Start: {key}", msg, self.dry, 3)

    # ------------------------------------------------------------------ Seitenwächter
    def process_watch(self, w) -> None:
        log(f"▶ {w.name} (Seitenwächter)")
        try:
            sec = w.section()
        except SourceError as e:
            return self.fail(w.name, str(e))
        except Exception as e:
            traceback.print_exc()
            return self.fail(w.name, f"{type(e).__name__}: {e}")
        self.ok(w.name)
        h = hashlib.sha256(sec.encode()).hexdigest()[:16]
        prev = self.st.watch.get(w.name)
        log(f"    Abschnitt: {sec[:160]!r}")
        if prev is None:
            self.st.watch[w.name] = {"hash": h, "text": sec[:1500], "since": iso(now())}
            return
        if prev["hash"] == h:
            return
        self.st.watch[w.name] = {"hash": h, "text": sec[:1500], "since": iso(now())}
        if w.is_relevant(sec):
            notify.send(self.topic, {
                "title": f"🏢 Neues bei {w.name}",
                "message": f"Der Angebotsbereich hat sich geändert:\n{sec[:600]}",
                "click": w.url, "priority": 4, "tags": ["office"],
                "actions": [{"action": "view", "label": "Seite öffnen", "url": w.url}]}, self.dry)
            self.pushes += 1
        else:
            log("    geändert, aber nichts Wohnungs-Relevantes")

    # ------------------------------------------------------------------ Wochenbericht
    def heartbeat(self) -> None:
        local = now().astimezone(TZ)
        last = parse_iso(self.st.meta.get("heartbeat"))
        week = self.st.meta.setdefault("week", {"treffer": 0, "neu": 0})
        week["treffer"] += self.stats["treffer"]
        week["neu"] += self.stats["neu"]
        if local.weekday() == 0 and local.hour >= 8 and (not last or now() - last > timedelta(days=6)):
            broken = [k for k, h in self.st.health.items() if h.get("fails", 0) >= FAIL_ALERT_AFTER]
            notify.system(self.topic, "📊 Wohnungsalarm: Wochenbericht",
                          f"Läuft. Letzte Woche: {week['neu']} neue Anzeigen geprüft, {week['treffer']} gemeldet.\n"
                          + (f"⚠️ Gestört: {', '.join(broken)}" if broken else "Alle Quellen OK."), self.dry, 2)
            self.st.meta["heartbeat"] = iso(now())
            self.st.meta["week"] = {"treffer": 0, "neu": 0}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="nichts senden, nur ausgeben")
    ap.add_argument("--state", default=os.path.join(os.path.dirname(__file__), "..", "state.json"))
    ap.add_argument("--only", help="nur Quellen, deren Name dies enthält")
    a = ap.parse_args()
    topic = os.environ.get("NTFY_TOPIC", "")
    if not topic and not a.dry_run:
        print("NTFY_TOPIC fehlt (GitHub-Secret setzen)", file=sys.stderr)
        return 2
    st = State(a.state)
    run = Run(st, topic, a.dry_run)
    for src in LIST_SOURCES:
        if not a.only or a.only.lower() in src.name.lower():
            run.process_source(src)
    for w in WATCHES:
        if not a.only or a.only.lower() in w.name.lower():
            run.process_watch(w)
    run.heartbeat()
    changed = st.save()
    log(f"Fertig: {run.stats}, {run.pushes} Pushes, state {'geändert' if changed else 'unverändert'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
