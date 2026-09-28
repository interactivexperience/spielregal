"""Temporäres Diagnose-Skript (nur Entwicklung): Karten-HTML + Detailseitentext je Quelle."""
import re, sys, json, requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

S = requests.Session()
S.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
                  "Accept-Language": "de-DE,de;q=0.9"})

def get(u):
    r = S.get(u, timeout=25); r.encoding = r.apparent_encoding if "kleinanzeigen" not in u else "utf-8"
    return r

def txt(el, n): return " ".join(el.get_text(" ").split())[:n]

for line in open(sys.argv[1]):
    line = line.strip()
    if not line or line.startswith("#"): continue
    u, _, rx = line.partition(" ")
    print("=" * 100); print("URL", u, "RX", rx)
    try: r = get(u)
    except Exception as e: print("  ERR", e); continue
    print("  status", r.status_code, r.url, len(r.text))
    s = BeautifulSoup(r.text, "html.parser")
    for marker in ["__NEXT_DATA__", "application/ld+json", "window.__", "data-testid", "aditem", "wgg_card", "offer_list_item"]:
        print(f"  has[{marker}]", r.text.count(marker))
    if not rx:
        print("  BODY", txt(s.body or s, 3500))
        for a in s.find_all("a", href=True)[:0]: pass
        continue
    links = []
    for a in s.find_all("a", href=True):
        h = urljoin(r.url, a["href"])
        if re.search(rx, h) and h not in [l[0] for l in links]: links.append((h, a))
    print("  n_links", len(links))
    for h, _ in links[:8]: print("   L", h)
    if not links: print("  BODY", txt(s.body or s, 2500)); continue
    a = links[0][1]; card = a
    for _ in range(8):
        if card.parent is None: break
        card = card.parent
        if len(txt(card, 5000)) > 120: break
    print("  CARD_TAG", card.name, card.attrs if len(str(card.attrs)) < 400 else str(card.attrs)[:400])
    print("  CARD_HTML", str(card)[:3500])
    print("  CARD_TEXT", txt(card, 800))
    for h, _ in links[1:4]:
        c = _
        for _i in range(8):
            if c.parent is None: break
            c = c.parent
            if len(txt(c, 5000)) > 120: break
        print("  CARD2_TEXT", txt(c, 500))
    try:
        d = get(links[0][0]); ds = BeautifulSoup(d.text, "html.parser")
        print("  DETAIL", d.status_code, d.url)
        for sc in ds.find_all("script", type="application/ld+json")[:3]: print("  DETAIL_LD", (sc.string or "")[:1500])
        for sc in ds.find_all("script"):
            t = sc.string or ""
            if "__NEXT_DATA__" in str(sc.attrs) or "__INITIAL" in t[:200] or "window.__UFRN" in t[:200]:
                print("  DETAIL_STATE", str(sc.attrs)[:100], t[:2500])
        for t in ds(["script", "style", "noscript"]): t.decompose()
        print("  DETAIL_TEXT", txt(ds.body or ds, 5000))
    except Exception as e: print("  DETAIL ERR", e)
