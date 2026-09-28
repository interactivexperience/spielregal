"""Quellen-Adapter.

Jede Listen-Quelle liefert Listing-Objekte aus der Suchergebnisseite (günstig, 1–3 Requests)
und kann optional eine Detailseite nachladen (nur für neue, nicht schon aussortierte Anzeigen).

Seitenwächter (Watch) beobachten Genossenschafts-/Unternehmensseiten ohne Anzeigenliste und
melden, wenn sich der Angebotsbereich ändert.
"""
import re
import time
from dataclasses import dataclass, field
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from .criteria import Listing
from .parse import NUM, to_float

NUM_EUR = NUM + r"\s*€"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/128.0 Safari/537.36")
_session = requests.Session()
_session.headers.update({"User-Agent": UA, "Accept-Language": "de-DE,de;q=0.9"})
_last_hit: dict[str, float] = {}
MIN_DELAY = 1.5  # Sekunden zwischen Requests auf denselben Host


class SourceError(Exception):
    pass


def fetch(url: str) -> BeautifulSoup:
    host = url.split("/")[2]
    wait = MIN_DELAY - (time.monotonic() - _last_hit.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    _last_hit[host] = time.monotonic()
    try:
        r = _session.get(url, timeout=25)
    except requests.RequestException as e:
        raise SourceError(f"{host}: {type(e).__name__}") from e
    if r.status_code != 200:
        raise SourceError(f"{host}: HTTP {r.status_code}")
    r.encoding = "utf-8"
    if re.search(r"Ich bin kein Roboter|captcha-delivery|Enable JavaScript and cookies", r.text[:5000], re.I):
        raise SourceError(f"{host}: Bot-Schutz/Captcha")
    return BeautifulSoup(r.text, "html.parser")


def text(el) -> str:
    return " ".join(el.get_text(" ").split()) if el else ""


# --------------------------------------------------------------------------- Listen-Quellen

@dataclass
class ListSource:
    name: str
    kind: str                         # miete | kauf
    urls: list[str]
    expect_nonempty: bool = True      # 0 Treffer = kaputt?
    notify_unclear: bool = False
    has_detail = False                # Klassenattribut: Detailseite nachladen?

    def listings(self) -> list[Listing]:
        out, seen = [], set()
        for u in self.urls:
            for l in self.parse_list(fetch(u), u):
                if l.id not in seen:
                    seen.add(l.id)
                    out.append(l)
        return out

    def parse_list(self, s: BeautifulSoup, url: str) -> list[Listing]:
        raise NotImplementedError

    def detail(self, l: Listing) -> None:
        """Ergänzt l.text / Felder aus der Detailseite. Standard: keine Detailseite."""


class Kleinanzeigen(ListSource):
    has_detail = True
    BASE = "https://www.kleinanzeigen.de"

    def parse_list(self, s, url):
        out = []
        for a in s.select("article[data-adid]"):
            href = a.get("data-href") or ""
            if not href.startswith("/s-anzeige/"):
                continue
            title = text(a.select_one("h2, h3")) or href.split("/")[2].replace("-", " ")
            t = text(a)
            l = Listing(self.name, a["data-adid"], self.BASE + href, self.kind, title=title, text=t)
            # Kartenpreis steht hinter "… m² · 3 Zi." – Beschreibungstext davor kann andere €-Beträge enthalten
            m = re.search(r"Zi\.(?:\s*·[^€]*?)?\s+" + NUM_EUR, t)
            if m:
                v = to_float(m.group(1), m.group(2))
                if self.kind == "kauf":
                    l.price = v
                else:
                    l.kalt = v  # Kleinanzeigen-Preisfeld bei Mietwohnungen = Kaltmiete
            out.append(l)
        return out

    def detail(self, l):
        s = fetch(l.url)
        parts = []
        for li in s.select("#viewad-details .addetailslist--detail"):
            label = text(li).replace(text(li.select_one(".addetailslist--detail--value")), "").strip()
            value = text(li.select_one(".addetailslist--detail--value"))
            parts.append(f"{label}: {value}")
            if label == "Etage" and value.isdigit():
                l.floor = int(value)
            elif label == "Zimmer":
                try:
                    l.rooms = float(value.replace(",", "."))
                except ValueError:
                    pass
            elif label == "Wohnungstyp" and re.search(r"Erdgeschoss|Hochparterre|Souterrain", value) and l.floor is None:
                l.floor = 0
            elif label == "Provision" and value == "Keine zusätzliche Käuferprovision":
                parts.append("provisionsfrei")
        tags = [text(t) for t in s.select("#viewad-configuration .checktag, .checktaglist .checktag")]
        price = text(s.select_one("#viewad-price"))
        l.text = " | ".join([f"Preis: {price}", *parts, "Ausstattung: " + ", ".join(tags),
                             text(s.select_one("#viewad-locality")), text(s.select_one("#viewad-description-text"))])
        l.detail_fetched = True


class Immowelt(ListSource):
    """Exposé-Seiten sind geblockt (403) – Karten enthalten aber Preis, Zimmer, Fläche, Etage, Kurztext."""

    def parse_list(self, s, url):
        out = []
        for c in s.select("[data-testid^=classified-card-mfe-]"):
            a = c.select_one("a[href*='/expose/']")
            if not a:
                continue
            href = urljoin("https://www.immowelt.de", a["href"]).split("?")[0]
            ident = href.rstrip("/").rsplit("/", 1)[-1]
            title = a.get("title") or text(c)[:80]
            t = text(c)
            l = Listing(self.name, ident, href, self.kind, title=title, text=t)
            m = re.search(NUM_EUR + r"\s*(Kaltmiete|Warmmiete)?", t)
            if m:
                v = to_float(m.group(1), m.group(2))
                if self.kind == "kauf":
                    l.price = v
                elif m.group(3) == "Warmmiete":
                    l.warm = v
                else:
                    l.kalt = v
            out.append(l)
        return out


class WgGesucht(ListSource):
    has_detail = True
    BASE = "https://www.wg-gesucht.de"

    def parse_list(self, s, url):
        out = []
        for c in s.select(".wgg_card.offer_list_item[data-id]"):
            a = c.select_one("h2 a[href], a[href]")
            if not a:
                continue
            t = text(c)
            l = Listing(self.name, c["data-id"], urljoin(self.BASE, a["href"]), self.kind,
                        title=text(c.select_one("h2")) or t[:80], text=t)
            # Listenpreis bei WG-Gesucht = Gesamtmiete
            m = re.search(r"(\d[\d.]*)\s*€", t)
            if m:
                l.warm = float(m.group(1).replace(".", ""))
            # Datumsbereich "01.10.2026 - 30.03.2027" = befristet
            if re.search(r"\d\d\.\d\d\.\d{4}\s*-\s*\d\d\.\d\d\.\d{4}", t):
                l.text += " | Zwischenmiete (befristet)"
            out.append(l)
        return out

    def detail(self, l):
        s = fetch(l.url)
        panels = [text(p) for p in s.select(".section_panel") if "WG-Gesucht+" not in text(p)]
        l.text = " | ".join([l.text, *panels])
        l.detail_fetched = True


class OhneMakler(ListSource):
    has_detail = True
    BASE = "https://www.ohne-makler.net"

    def parse_list(self, s, url):
        out = []
        for a in s.select("a[data-om-id]"):
            t = text(a)
            l = Listing(self.name, a["data-om-id"], urljoin(self.BASE, a["href"]), self.kind,
                        title=text(a.select_one("h4")) or t[:80], text=t + " | provisionsfrei")
            for el in a.select("[title]"):
                v = text(el).replace("m²", "").replace(".", "").replace(",", ".").strip()
                try:
                    if el["title"] == "Zimmer":
                        l.rooms = float(v)
                    elif el["title"] == "Wohnfläche":
                        l.area = float(v)
                except ValueError:
                    pass
            out.append(l)
        return out

    def detail(self, l):
        s = fetch(l.url)
        for t in s(["script", "style", "noscript", "header", "nav", "footer"]):
            t.decompose()
        body = text(s.body)
        body = body.split("Exposé drucken", 1)[-1]
        body = re.sub(r"OM-\w+[^A-ZÄÖÜ]*", " ", body)  # Leistungs-Menü (z.B. "OM-Neubau Neubauprojekte ...")
        l.text = l.text + " | " + body[:6000]
        l.detail_fetched = True


# --------------------------------------------------------------------------- Seitenwächter

@dataclass
class Watch:
    name: str
    url: str
    start: str                   # Regex: Beginn des Angebotsbereichs
    end: str                     # Regex: Ende des Angebotsbereichs
    relevant: str = r"Wohnung|Zimmer|m²"   # nur melden, wenn neuer Bereich das enthält
    ignore: str = r""            # Teile, die nie relevant sind (z.B. Stellplätze)

    def section(self) -> str:
        s = fetch(self.url)
        for t in s(["script", "style", "noscript"]):
            t.decompose()
        body = text(s.body)
        m = re.search(self.start, body)
        if not m:
            raise SourceError(f"{self.name}: Angebotsbereich nicht gefunden (Seite umgebaut?)")
        rest = body[m.end():]
        e = re.search(self.end, rest)
        return (rest[: e.start()] if e else rest[:3000]).strip()

    def is_relevant(self, section: str) -> bool:
        s = re.sub(self.ignore, " ", section) if self.ignore else section
        return bool(re.search(self.relevant, s))


# --------------------------------------------------------------------------- Konfiguration

KA = "https://www.kleinanzeigen.de"
IW = "https://www.immowelt.de/suche/{typ}/wohnung/{zi}nordrhein-westfalen/munster-48143/ad08de2279?sort=createdate%20desc"

LIST_SOURCES: list[ListSource] = [
    Kleinanzeigen("Kleinanzeigen", "miete", [
        f"{KA}/s-wohnung-mieten/muenster/anzeige:angebote/preis::1100/c203l929+wohnung_mieten.zimmer_d:3.0%2C"]),
    Kleinanzeigen("Kleinanzeigen", "kauf", [
        f"{KA}/s-wohnung-kaufen/muenster/anzeige:angebote/preis::330000/c196l929+wohnung_kaufen.zimmer_d:3.0%2C"]),
    Immowelt("Immowelt", "miete", [IW.format(typ="mieten", zi=""), IW.format(typ="mieten", zi="zimmer-3/"),
                                   IW.format(typ="mieten", zi="zimmer-4/")]),
    Immowelt("Immowelt", "kauf", [IW.format(typ="kaufen", zi=""), IW.format(typ="kaufen", zi="zimmer-3/"),
                                  IW.format(typ="kaufen", zi="zimmer-4/")]),
    WgGesucht("WG-Gesucht", "miete", ["https://www.wg-gesucht.de/wohnungen-in-Muenster.91.2.1.0.html"]),
    OhneMakler("ohne-makler.net", "kauf", ["https://www.ohne-makler.net/immobilien/wohnung-kaufen/nordrhein-westfalen/munster/"]),
    OhneMakler("ohne-makler.net", "miete", ["https://www.ohne-makler.net/immobilien/wohnung-mieten/nordrhein-westfalen/munster/"],
               expect_nonempty=False),
]

WATCHES: list[Watch] = [
    Watch("Wohn + Stadtbau (Miete)", "https://www.wohnstadtbau.de/mieten/mietangebote/",
          start=r"Wir haben derzeit", end=r"Rund [\d.]+ Einwohner", relevant=r"\bWohnung\b|Zimmer"),
    Watch("Wohn + Stadtbau (Kauf)", "https://www.wohnstadtbau.de/kaufen/",
          start=r"Unsere aktuellen Kaufangebote", end=r"Hinweis zum Bewerbungsverfahren|Kontakt 0251",
          relevant=r"Eigentumswohnung|Wohnungen|Zimmer"),
    Watch("Wohnungsverein Münster", "https://www.wohnungsverein-muenster.de/unsere-mietangebote.html",
          start=r"Unsere Mietangebote Unsere Mietangebote", end=r"Navigation überspringen",
          relevant=r"."),
    Watch("Bauverein Ketteler", "https://bauverein-ketteler.de/_wp2014/category/angebote/",
          start=r"Artikel in der Kategorie", end=r"Neuigkeiten:", relevant=r"Wohnung|Zimmer|m²"),
]
