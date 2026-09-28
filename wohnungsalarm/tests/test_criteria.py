"""Tests mit echten Kartentexten aus den Quellen (Stand 2026-09-28)."""
import unittest

from wohnungsalarm import parse
from wohnungsalarm.criteria import Listing, evaluate


def L(kind, title, text="", **kw):
    return Listing("test", "1", "https://example.org", kind, title=title, text=text, **kw)


class ParseTest(unittest.TestCase):
    def test_rooms_area(self):
        t = "90 m² · 3 Zi. 1.000 € Von Privat"
        self.assertEqual(parse.rooms(t), 3)
        self.assertEqual(parse.area(t), 90)
        self.assertEqual(parse.rooms("3,5 Zimmer · 84 m²"), 3.5)
        self.assertEqual(parse.area("64,61 m² · 2 Zi."), 64.61)
        self.assertIsNone(parse.rooms("2 Schlafzimmer"))

    def test_rent(self):
        self.assertEqual(parse.rent("1.050 € Kaltmiete Wohnung zur Miete")["kalt"], 1050)
        r = parse.rent("Größe : 120m² Gesamtmiete : 2280€ Zimmer : 4 Kosten Miete: 1800€")
        self.assertEqual(r["warm"], 2280)
        r = parse.rent("Kaltmiete: 780 € Nebenkosten: 190 € Heizkosten: 60 €")
        self.assertEqual((r["kalt"], r["nk"]), (780, 250))
        self.assertIsNone(parse.rent("Warmwasser über Zentralheizung, 3 Zimmer")["warm"])
        # "inkl" darf nicht als "NK" gelesen werden
        self.assertIsNone(parse.rent("Einbauküche inkl 250 € Ablöse")["nk"])

    def test_floor(self):
        self.assertEqual(parse.floor("3 Zimmer · 86 m² · Geschoss 1/4"), 1)
        self.assertEqual(parse.floor("3,5 Zimmer, 84 m², 2. Geschoss"), 2)
        self.assertEqual(parse.floor("Stockwerk 2. OG Nutzfläche 34 m²"), 2)
        self.assertEqual(parse.floor("3 Zi-Whg., Hochparterre mit EBK"), 0)
        self.assertEqual(parse.floor("Etage: 1 | Wohnungstyp: Dachgeschosswohnung"), 1)
        self.assertEqual(parse.floor("76 m² · EG Centrum"), 0)
        self.assertIsNone(parse.floor("Balkon, WEG-Beschluss"))
        # "Erdgeschoss" + Zahl darf keine Etage 2 ergeben
        self.assertEqual(parse.floor("Wohnung im Erdgeschoss 2 Zimmer"), 0)

    def test_features(self):
        f = parse.features("Ausstattung: Balkon, Einbauküche, Aufzug, Keller, Garage/Stellplatz | Neubau-Erstbezug")
        self.assertTrue(f["balkon"] and f["aufzug"] and f["parkplatz"] and f["renoviert"])
        self.assertFalse(parse.features("unsanierter Altbau")["renoviert"])
        self.assertTrue(parse.features("TAUSCHWOHNUNG 3-Zimmer-Wohnung")["tausch"])
        self.assertFalse(parse.features("unbefristeter Mietvertrag")["befristet"])
        self.assertTrue(parse.features("Wg Zimmer frei, bitte ganzen Text lesen")["zwischenmiete"])


class EvaluateTest(unittest.TestCase):
    def test_rent_match_with_estimated_nk(self):
        # Kaltmiete 750 + 78 m² * 3 € = 984 € -> Treffer (geschätzt)
        l = L("miete", "3 Zi-Whg., Hochparterre mit EBK u. Balkon in Münster Albachten",
              "48163 Albachten 78 m² · 3 Zi. 750 € Von Privat", kalt=750)
        v = evaluate(l)
        self.assertEqual(v.status, "treffer")
        self.assertTrue(v.cost_estimated)
        self.assertIn("balkon", v.extras)

    def test_rent_knapp(self):
        l = L("miete", "Helle 3-Zimmer-Wohnung in Kinderhaus", "3-Zimmer-Wohnung | Münster Kinderhaus 78 m²", warm=1080)
        self.assertEqual(evaluate(l).status, "knapp")

    def test_rent_too_expensive(self):
        l = L("miete", "Wohnung", "1.350 € Kaltmiete Wohnung zur Miete 3 Zimmer · 79 m²")
        self.assertEqual(evaluate(l).status, "raus")

    def test_tausch_and_wg(self):
        self.assertEqual(evaluate(L("miete", "TAUSCHWOHNUNG 3 Zi Whg mit Balkon", "60 m² · 3 Zi. 530 €")).status, "raus")
        self.assertEqual(evaluate(L("miete", "Wg Zimmer frei, bitte ganzen Text lesen", "69 m² · 3 Zi. 350 €")).status, "raus")
        # Immowelt-Müll: 7 Zimmer auf 17 m²
        self.assertEqual(evaluate(L("miete", "x", "450 € Kaltmiete 7 Zimmer · 17 m² · 2. Geschoss")).status, "raus")

    def test_too_few_rooms(self):
        self.assertEqual(evaluate(L("miete", "2,5-Zimmer Wohnung", "810 € | 50 m² 2,5-Zimmer-Wohnung", warm=810)).status, "raus")

    def test_buy_match(self):
        l = L("kauf", "Wohnung zum Kauf - Münster - 265.000 € - 3,5 Zimmer, 84 m², 2. Geschoss",
              "265.000 € 3.155 €/m² Wohnung zum Kauf 3,5 Zimmer · 84 m² · 2. Geschoss Coerde, Münster (48157)")
        v = evaluate(l)
        self.assertEqual((v.status, v.cost, l.floor), ("treffer", 265000, 2))

    def test_buy_ground_floor_out(self):
        l = L("kauf", "Gepflegte 3-Zimmer-Terrassenwohnung", "im Erdgeschoss 63,77 m² · 3 Zi. 160.000 €", price=160000)
        self.assertEqual(evaluate(l).status, "raus")

    def test_buy_knapp_and_provisionsfrei(self):
        l = L("kauf", "Provisionsfrei! Klimatisierte 3,5-Zimmer-Wohnung", "48165 Münster (Hiltrup) | Stockwerk 1. OG",
              price=325000, rooms=3.5, area=82)
        v = evaluate(l)
        self.assertEqual(v.status, "knapp")
        self.assertIn("provisionsfrei", v.extras)

    def test_buy_outside_muenster(self):
        l = L("kauf", "3 Zimmer", "48341 Altenberge 3 Zi. 2. OG", price=250000)
        self.assertEqual(evaluate(l).status, "raus")

    def test_unclear_price(self):
        v = evaluate(L("kauf", "Schöne 3-Zimmer-Wohnung", "3 Zimmer, 2. OG, Preis auf Anfrage"))
        self.assertEqual(v.status, "unklar")


if __name__ == "__main__":
    unittest.main()
