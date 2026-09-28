"""Temporäres Diagnose-Skript: zeigt Struktur der Kandidaten-Quellen (nur für Entwicklung)."""
import re, sys, requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
      "Accept-Language": "de-DE,de;q=0.9"}
KW = re.compile(r"wohn|expos|objekt|immobil|angebot|miet|kauf|detail|zimmer", re.I)
VENDOR = re.compile(r"immomio|onoffice|flowfact|immosolve|ivd24|openimmo|propstack|wohnungshelden|immobilienscout|is24|estatepro|justimmo|api", re.I)

urls = sys.argv[1:]
for u in urls:
    print("=" * 100); print("URL", u)
    try:
        r = requests.get(u, headers=UA, timeout=25)
    except Exception as e:
        print("  ERR", e); continue
    print("  status", r.status_code, "final", r.url, "len", len(r.text))
    s = BeautifulSoup(r.text, "html.parser")
    print("  title", (s.title.string or "").strip()[:120] if s.title else None)
    for f in s.find_all("iframe"): print("  IFRAME", f.get("src"))
    for sc in s.find_all("script", src=True):
        if VENDOR.search(sc["src"]): print("  SCRIPT", sc["src"])
    for m in set(re.findall(r"https?://[\w.-]*(?:api|immomio|onoffice|immosolve|wohnungshelden|propstack|flowfact)[\w./?=&%-]*", r.text))[:15] if False else list(set(re.findall(r"https?://[\w.-]*(?:api|immomio|onoffice|immosolve|wohnungshelden|propstack|flowfact)[\w./?=&%-]*", r.text)))[:15]:
        print("  APIURL", m)
    seen = set(); n = 0
    for a in s.find_all("a", href=True):
        h = urljoin(r.url, a["href"]); t = " ".join(a.get_text(" ").split())[:90]
        if h in seen or not (KW.search(h) or KW.search(t)): continue
        seen.add(h); n += 1
        if n <= 45: print("  A", h, "|", t)
    print("  matching links:", n)
    body = " ".join(s.get_text(" ").split())
    for kw in ["Zimmer", "Kaltmiete", "Warmmiete", "Kaufpreis", "m²"]:
        i = body.find(kw)
        if i >= 0: print(f"  CTX[{kw}]", body[max(0,i-150):i+150])
