"""Suchkriterien und Bewertung.

Harte Kriterien entscheiden über treffer / knapp / raus.
Weiche Kriterien (Wunschliste) ergeben nur Sterne für die Rangfolge.
"""
from dataclasses import dataclass, field

from . import parse

# --- Kriterien (hier anpassen) -------------------------------------------------
MIETE_WARM_MAX = 1000        # € inkl. Nebenkosten
KAUF_PREIS_MAX = 300_000     # €
ZIMMER_MIN = 3
KAUF_ETAGE_MIN = 1           # 1. OG oder höher
TOLERANZ = 0.10              # bis +10 % -> "knapp drüber" statt raus
NK_SCHAETZUNG_PRO_QM = 3.0   # €/m², falls nur Kaltmiete angegeben
NK_SCHAETZUNG_PAUSCHAL = 250 # €, falls weder NK noch Fläche bekannt
MUENSTER_PLZ = ("481",)      # 48143–48167

WUNSCH = ("renoviert", "parkplatz", "balkon", "aufzug")   # Kauf zusätzlich: provisionsfrei


@dataclass
class Listing:
    source: str
    id: str
    url: str
    kind: str                # "miete" | "kauf"
    title: str = ""
    text: str = ""           # Karten- + ggf. Detailtext, Grundlage fürs Parsen
    # optional strukturiert von der Quelle geliefert (hat Vorrang vor Parser)
    rooms: float | None = None
    area: float | None = None
    warm: float | None = None
    kalt: float | None = None
    nk: float | None = None
    price: float | None = None
    floor: int | None = None
    detail_fetched: bool = False


@dataclass
class Verdict:
    status: str                       # "treffer" | "knapp" | "raus" | "unklar"
    reasons: list[str] = field(default_factory=list)   # warum raus/knapp/unklar
    stars: int = 0
    extras: list[str] = field(default_factory=list)    # erfüllte Wünsche
    warnings: list[str] = field(default_factory=list)
    cost: float | None = None          # Warmmiete bzw. Kaufpreis
    cost_estimated: bool = False


def enrich(l: Listing) -> None:
    """Fehlende Felder aus dem Freitext ergänzen."""
    t = f"{l.title}\n{l.text}"
    if l.rooms is None:
        l.rooms = parse.rooms(t)
    if l.area is None:
        l.area = parse.area(t)
    if l.floor is None:
        l.floor = parse.floor(t)
    if l.kind == "miete":
        r = parse.rent(t)
        l.warm = l.warm if l.warm is not None else r["warm"]
        l.kalt = l.kalt if l.kalt is not None else r["kalt"]
        l.nk = l.nk if l.nk is not None else r["nk"]
    elif l.price is None:
        l.price = parse.purchase_price(t)


def _band(value: float, limit: float) -> str:
    if value <= limit:
        return "treffer"
    if value <= limit * (1 + TOLERANZ):
        return "knapp"
    return "raus"


def evaluate(l: Listing) -> Verdict:
    enrich(l)
    t = f"{l.title}\n{l.text}"
    f = parse.features(t)
    v = Verdict(status="treffer")

    # Ausschlüsse unabhängig vom Preis
    if f["gesuch"] or f["tausch"]:
        return Verdict("raus", ["Gesuch/Tausch"])
    if f["versteigerung"]:
        return Verdict("raus", ["Versteigerung"])
    plz = parse.postcodes(t)
    if plz and not any(p.startswith(MUENSTER_PLZ) for p in plz):
        return Verdict("raus", [f"PLZ {plz[0]} nicht Münster"])

    # Zimmer
    if l.rooms is None:
        v.status = "unklar"; v.reasons.append("Zimmerzahl unbekannt")
    elif l.rooms < ZIMMER_MIN:
        return Verdict("raus", [f"{l.rooms:g} Zi."])

    # Preis
    if l.kind == "miete":
        cost, est = l.warm, False
        if cost is None and l.kalt is not None:
            nk = l.nk if l.nk is not None else (l.area * NK_SCHAETZUNG_PRO_QM if l.area else NK_SCHAETZUNG_PAUSCHAL)
            cost, est = l.kalt + nk, l.nk is None
        limit = MIETE_WARM_MAX
    else:
        cost, est, limit = l.price, False, KAUF_PREIS_MAX
    v.cost, v.cost_estimated = cost, est
    if cost is None:
        v.status = "unklar"; v.reasons.append("Preis unbekannt")
    else:
        band = _band(cost, limit)
        if band == "raus":
            return Verdict("raus", [f"{cost:,.0f} €"], cost=cost, cost_estimated=est)
        if band == "knapp":
            v.reasons.append(f"{(cost / limit - 1) * 100:.0f} % über Limit")
            if v.status == "treffer":
                v.status = "knapp"

    # Etage (nur Kauf hart)
    if l.kind == "kauf":
        if l.floor is not None and l.floor < KAUF_ETAGE_MIN:
            return Verdict("raus", ["Erdgeschoss/Souterrain"])
        if l.floor is None:
            v.warnings.append("Etage unklar")

    # Wunschliste -> Sterne
    wishes = WUNSCH + (("provisionsfrei",) if l.kind == "kauf" else ())
    for w in wishes:
        if f[w]:
            v.stars += 1
            v.extras.append(w)
    if f["renovierungsbeduerftig"]:
        v.warnings.append("renovierungsbedürftig")
        v.stars = max(0, v.stars - 1)
    if l.kind == "kauf" and f["provision"] and not f["provisionsfrei"]:
        v.warnings.append("mit Provision")
    if f["wbs"]:
        v.warnings.append("WBS nötig?")
    if f["befristet"]:
        v.warnings.append("befristet/Zwischenmiete?")
    return v
