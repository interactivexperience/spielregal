"""Temporär: gezielte Struktur-Checks (Detailseiten, URL-Filter)."""
import re, requests
from bs4 import BeautifulSoup
S = requests.Session()
S.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36", "Accept-Language": "de-DE,de;q=0.9"})
def soup(u):
    r = S.get(u, timeout=25); r.encoding = "utf-8"
    print("  GET", r.status_code, r.url, len(r.text)); return BeautifulSoup(r.text, "html.parser"), r
def t(e, n=600): return " ".join(e.get_text(" ").split())[:n] if e else None
def hdr(x): print("=" * 90); print(x)

hdr("KA filter mieten")
for u in ["https://www.kleinanzeigen.de/s-wohnung-mieten/muenster/anzeige:angebote/preis::1100/c203l929+wohnung_mieten.zimmer_d:3.0%2C",
          "https://www.kleinanzeigen.de/s-wohnung-kaufen/muenster/anzeige:angebote/preis::330000/c196l929+wohnung_kaufen.zimmer_d:3.0%2C"]:
    s, r = soup(u)
    arts = s.select("article[data-adid]"); print("  articles", len(arts))
    for a in arts[:6]: print("   C", t(a, 300))
    if arts:
        d, _ = soup("https://www.kleinanzeigen.de" + arts[0]["data-href"])
        for sel in ["#viewad-title", "#viewad-price", "#viewad-locality", "#viewad-details", ".addetailslist", "#viewad-configuration", ".checktaglist", "#viewad-description-text", "#viewad-extra-info"]:
            print("   D", sel, "=>", t(d.select_one(sel), 900))
        dl = d.select(".addetailslist--detail"); print("   n_detail_items", len(dl))
        for li in dl[:25]: print("    LI", repr(t(li, 120)), "| value:", t(li.select_one(".addetailslist--detail--value"), 60))

hdr("Immowelt filters")
for u in ["https://www.immowelt.de/suche/mieten/wohnung/zimmer-3/nordrhein-westfalen/munster-48143/ad08de2279?sort=createdate%20desc",
          "https://www.immowelt.de/suche/mieten/wohnung/nordrhein-westfalen/munster-48143/ad08de2279?sort=createdate%20desc&page=2",
          "https://www.immowelt.de/classified-search?distributionTypes=Rent&estateTypes=Apartment&locations=AD08DE2279&numberOfRoomsMin=3&priceMax=1100&order=DateDesc",
          "https://www.immowelt.de/classified-search?distributionTypes=Buy&estateTypes=Apartment&locations=AD08DE2279&numberOfRoomsMin=3&priceMax=330000&order=DateDesc"]:
    s, r = soup(u)
    cards = s.select("[data-testid^=classified-card-mfe-]"); print("  cards", len(cards))
    for c in cards[:8]:
        a = c.select_one("a[href*='/expose/']")
        print("   C", a.get("title") if a else None, "||", t(c, 160))

hdr("WG detail tail")
s, r = soup("https://www.wg-gesucht.de/wohnungen-in-Muenster.91.2.1.0.html")
links = [a["href"] for a in s.select("a[href]") if re.search(r"wohnungen-in-Muenster.*\.\d{6,}\.html$", a["href"])]
print("  n", len(set(links)))
cards = s.select(".wgg_card.offer_list_item"); print("  cards", len(cards))
for c in cards[:5]: print("   C", c.get("data-id"), t(c, 250))
if links:
    d, _ = soup("https://www.wg-gesucht.de" + links[1] if links[1].startswith("/") else links[1])
    for sel in ["h1", ".section_panel", "#freitext_0", "#freitext_1", "#freitext_2", ".utility_icons", ".section_panel_detail"]:
        els = d.select(sel); print("   D", sel, len(els), "=>", [t(e, 400) for e in els[:6]])

hdr("ohne-makler cards")
s, r = soup("https://www.ohne-makler.net/immobilien/wohnung-kaufen/nordrhein-westfalen/munster/")
for a in s.select("a[data-om-id]")[:4]:
    print("   C", a["data-om-id"], a.get("data-om-type"), t(a, 250), [ (x.get("title"), t(x, 30)) for x in a.select("[title]")])
print("  pagination", [x.get("href") for x in s.select("a[href*='page']")][:5])

hdr("ketteler")
for u in ["https://bauverein-ketteler.de/_wp2014/category/angebote/", "https://bauverein-ketteler.de/_wp2014/wp-json/wp/v2/posts?per_page=5&_fields=id,date,link,title,categories"]:
    s, r = soup(u); print("  ", r.text[:1500] if "wp-json" in u else t(s.find("main") or s.body, 1500))
