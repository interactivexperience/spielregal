"""Push über ntfy.sh (JSON-API, damit Umlaute in Titel/Tags funktionieren)."""
import os

import requests

from .criteria import Listing, Verdict

NTFY_SERVER = os.environ.get("NTFY_SERVER", "https://ntfy.sh")

EMOJI = {"parkplatz": "🚗", "balkon": "🌿", "aufzug": "🛗", "renoviert": "✨", "provisionsfrei": "💶"}
LABEL = {"parkplatz": "Parkplatz", "balkon": "Balkon", "aufzug": "Aufzug", "renoviert": "renoviert/neu",
         "provisionsfrei": "provisionsfrei"}


def _eur(x: float | None) -> str:
    return "?" if x is None else f"{x:,.0f} €".replace(",", ".")


def format_message(l: Listing, v: Verdict) -> dict:
    head = {"treffer": "🏠", "knapp": "🟡", "unklar": "❔"}.get(v.status, "")
    kind = "Miete" if l.kind == "miete" else "Kauf"
    cost = _eur(v.cost) + (" warm (NK geschätzt)" if v.cost_estimated else " warm" if l.kind == "miete" else "")
    de = lambda x: f"{x:g}".replace(".", ",")
    facts = [f"{de(l.rooms)} Zi." if l.rooms else "? Zi.", f"{de(l.area)} m²" if l.area else None, cost]
    if l.kind == "kauf" and l.floor is not None:
        facts.append("DG" if l.floor == 99 else f"{l.floor}. OG" if l.floor else "EG")
    lines = [" · ".join(x for x in facts if x)]
    if v.extras:
        lines.append("✔ " + ", ".join(f"{EMOJI[e]} {LABEL[e]}" for e in v.extras))
    missing = [LABEL[w] for w in ("renoviert", "parkplatz", "balkon", "aufzug") + (("provisionsfrei",) if l.kind == "kauf" else ())
               if w not in v.extras]
    if missing:
        lines.append("✘ nicht erwähnt: " + ", ".join(missing))
    if v.status != "treffer" and v.reasons:
        lines.append("⚠ " + "; ".join(v.reasons))
    if v.warnings:
        lines.append("⚠ " + "; ".join(v.warnings))
    lines.append(f"Quelle: {l.source}")
    title = f"{head} {kind} {'★' * v.stars} {l.title}".strip()[:120]
    prio = 4 if v.status == "treffer" and v.stars >= 2 else 3 if v.status == "treffer" else 2
    return {"title": title, "message": "\n".join(lines), "click": l.url, "priority": prio,
            "tags": ["house" if l.kind == "kauf" else "key"],
            "actions": [{"action": "view", "label": "Anzeige öffnen", "url": l.url}]}


def send(topic: str, payload: dict, dry_run: bool = False) -> None:
    body = {"topic": topic, **payload}
    if dry_run:
        print("[DRY-RUN ntfy]", body["title"], "|", body["message"].replace("\n", " / "), "|", body.get("click", ""))
        return
    r = requests.post(NTFY_SERVER, json=body, timeout=20)
    r.raise_for_status()


def system(topic: str, title: str, message: str, dry_run: bool = False, priority: int = 3) -> None:
    try:
        send(topic, {"title": title, "message": message, "priority": priority, "tags": ["warning"]}, dry_run)
    except Exception as e:  # Systemmeldungen dürfen den Lauf nie abbrechen
        print(f"Systemmeldung fehlgeschlagen: {e}", flush=True)
