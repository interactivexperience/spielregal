"""Extrahiert Eckdaten aus deutschem Anzeigen-Freitext.

Alle Funktionen sind bewusst tolerant: lieber None zurückgeben als falsch raten.
"""
import re

NUM = r"(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:,(\d{1,2}))?"


def to_float(whole: str, frac: str | None = None) -> float:
    whole = re.sub(r"[.\s]", "", whole)
    return float(f"{whole}.{frac}" if frac else whole)


def _money_after(label: str, text: str) -> float | None:
    """Betrag in € direkt hinter einem Label, z.B. 'Kaltmiete: 780 €'."""
    m = re.search(label + r"[^\d€]{0,40}?" + NUM + r"\s*(?:€|EUR|Euro)", text, re.I)
    if m:
        return to_float(m.group(1), m.group(2))
    # auch "€ 780" bzw. Label ohne Einheit (tabellarische Detailseiten)
    m = re.search(label + r"[^\d€]{0,40}?(?:€|EUR)\s*" + NUM, text, re.I)
    if m:
        return to_float(m.group(1), m.group(2))
    return None


def _money_before(label: str, text: str) -> float | None:
    """Betrag direkt VOR einem Label, z.B. '1.050 € Kaltmiete' (Immowelt-Karten)."""
    m = re.search(NUM + r"\s*(?:€|EUR)\s*" + label, text, re.I)
    return to_float(m.group(1), m.group(2)) if m else None


def rooms(text: str) -> float | None:
    m = re.search(r"(\d(?:[.,]5)?)\s*(?:-\s*)?(?:Zimmer|Zi\.|Zi\b|Raum|ZKB|Zimmerwohnung)", text, re.I)
    if not m:
        m = re.search(r"Zimmer(?:anzahl)?\s*:?\s*(\d(?:[.,]5)?)\b", text, re.I)
    if not m:
        return None
    v = float(m.group(1).replace(",", "."))
    return v if 0.5 <= v <= 12 else None


def area(text: str) -> float | None:
    m = re.search(NUM + r"\s*(?:m²|m2|qm|quadratmeter)", text, re.I)
    if not m:
        m = re.search(r"Wohnfläche\s*(?:ca\.)?\s*:?\s*" + NUM, text, re.I)
    if not m:
        return None
    v = to_float(m.group(1), m.group(2))
    return v if 10 <= v <= 400 else None


def rent(text: str) -> dict:
    """{'warm': float|None, 'kalt': float|None, 'nk': float|None}"""
    warm = _money_before(r"(?:Warmmiete|Gesamtmiete)", text) or _money_after(r"(?:Warmmiete|Gesamtmiete|Miete\s+(?:inkl\.?|inklusive)\s+(?:NK|Nebenkosten)|Bruttomiete|\bwarm\b)", text)
    kalt = _money_before(r"Kaltmiete", text) or _money_after(r"(?:Kaltmiete|Nettokaltmiete|Grundmiete|Miete\s*\(kalt\)|\bkalt\b)", text)
    nk = _money_after(r"(?:Nebenkosten|Betriebskosten|\bNK\b)(?:\s*\(?(?:inkl\.|zzgl\.)?\s*Heizkosten\)?)?", text)
    hk = _money_after(r"Heizkosten", text)
    if nk is not None and hk is not None and not re.search(r"(?:Nebenkosten|NK)[^.]{0,30}inkl\.?\s*Heiz", text, re.I):
        nk = nk + hk
    # Plausibilität: Monatsmieten zwischen 150 und 5000 €
    def ok(v, lo=150, hi=5000):
        return v if v is not None and lo <= v <= hi else None
    return {"warm": ok(warm), "kalt": ok(kalt), "nk": ok(nk, 20, 1500)}


def purchase_price(text: str) -> float | None:
    v = _money_after(r"(?:Kaufpreis|Preis|VB|Festpreis)", text)
    if v is None:
        m = re.search(NUM + r"\s*(?:€|EUR|Euro)\s*(?:VB)?", text)
        v = to_float(m.group(1), m.group(2)) if m else None
    return v if v is not None and 20_000 <= v <= 5_000_000 else None


FLOOR_WORDS = [
    (r"\b(?:Erdgeschoss|Erdgeschoß|EG\b|Hochparterre|Parterre|Souterrain|Tiefparterre|Untergeschoss)", 0),
    (r"\b(?:Dachgeschoss|Dachgeschoß|DG\b|Penthouse|Maisonette)", 99),
]


def floor(text: str) -> int | None:
    """Etage als Zahl (EG=0, DG=99 als 'oben, genaue Etage unbekannt'), None wenn unklar."""
    m = re.search(r"(\d{1,2})\s*\.\s*(?:OG|Obergeschoss|Obergeschoß|Etage|Stock|Geschoss)\b", text, re.I)
    if m:
        return int(m.group(1))
    m = re.search(r"\b(?:Etage|Geschoss|Stockwerk)\s*:?\s*(\d{1,2})\b", text, re.I)
    if m:
        return int(m.group(1))
    for pat, val in FLOOR_WORDS:
        if re.search(pat, text, re.I):
            return val
    return None


FEATURES = {
    "parkplatz": r"Stellpl[aä]tz|Parkpl[aä]tz|Tiefgarage|Garage|Carport|TG-Platz|Duplexparker",
    "balkon": r"Balkon|Loggia|Dachterrasse",
    "aufzug": r"Aufzug|Fahrstuhl|Lift\b|Personenaufzug",
    "renoviert": r"renoviert|saniert|modernisiert|kernsaniert|Neubau|Erstbezug|neuwertig|Baujahr\s*20[12]\d|neu\s+renoviert",
    "provisionsfrei": r"provisionsfrei|ohne\s+Makler|keine\s+(?:Käufer)?provision|von\s+privat|privatverkauf|0\s*%\s*Provision",
}
NEGATIVE = {
    "renovierungsbeduerftig": r"renovierungsbedürftig|sanierungsbedürftig|modernisierungsbedürftig|Handwerkerobjekt|Renovierungsstau",
    "provision": r"(?:Käufer|Makler)[- ]?(?:provision|courtage)\s*:?\s*\d",
    "wbs": r"\bWBS\b|Wohnberechtigungsschein|öffentlich gefördert",
    "tausch": r"Tauschwohnung|Tauschangebot|Wohnungstausch|\bTausch\b|zu\s+tauschen",
    "gesuch": r"^\s*(?:Suche|Gesucht|Wir suchen|Ich suche)\b",   # nur auf den Titel anwenden
    "zwischenmiete": r"Zwischenmiete|Untermiete|\bWG[- ]?Zimmer|Zimmer\s+(?:zum\s+Unter|frei\b)|möbliert\s+auf\s+Zeit",
    "befristet": r"(?<!un)befristet|Zeitmiete",
    "versteigerung": r"Zwangsversteigerung|Versteigerung",
}

# 'saniert' in 'unsaniert' / 'nicht renoviert' darf nicht zählen
_NEGATED = r"(?:un|nicht\s+|teil)(?:saniert|renoviert|modernisiert)"


def features(text: str) -> dict:
    out = {k: bool(re.search(p, text, re.I)) for k, p in FEATURES.items()}
    if out["renoviert"]:
        stripped = re.sub(_NEGATED, "", text, flags=re.I)
        out["renoviert"] = bool(re.search(FEATURES["renoviert"], stripped, re.I))
    out["provisionsfrei"] = out["provisionsfrei"] and not re.search(r"nicht\s+provisionsfrei", text, re.I)
    for k, p in NEGATIVE.items():
        out[k] = bool(re.search(p, text, re.I | re.M))
    return out


def postcodes(text: str) -> list[str]:
    return re.findall(r"\b(4\d{4})\b", text)
