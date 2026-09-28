"""Ablauf-Tests mit einer Fake-Quelle: Erstlauf, Duplikate, Preissenkung, Ausfallwarnung."""
import os
import tempfile
import unittest
from unittest import mock

from wohnungsalarm import notify, run
from wohnungsalarm.criteria import Listing
from wohnungsalarm.sources import ListSource, SourceError
from wohnungsalarm.state import State


class Fake(ListSource):
    has_detail = True

    def __init__(self, items):
        super().__init__("Fake", "kauf", [])
        self.items, self.detail_calls, self.error = items, 0, None

    def listings(self):
        if self.error:
            raise SourceError(self.error)
        return [Listing(**vars(l)) for l in self.items]  # frische Kopien wie bei echtem Abruf

    def detail(self, l):
        self.detail_calls += 1
        l.text += " | Stockwerk 2. OG"
        l.detail_fetched = True


def item(i, price, title="3-Zimmer-Wohnung mit Balkon"):
    return Listing("Fake", str(i), f"https://x/{i}", "kauf", title=title, text=f"48155 Münster 3 Zi. 80 m²", price=price)


class RunTest(unittest.TestCase):
    def setUp(self):
        self.path = os.path.join(tempfile.mkdtemp(), "state.json")
        self.sent = []
        p = mock.patch.object(notify, "send", lambda topic, payload, dry=False: self.sent.append(payload["title"]))
        p.start()
        self.addCleanup(p.stop)

    def cycle(self, src):
        st = State(self.path)
        r = run.Run(st, "t", dry=False)
        r.process_source(src)
        st.save()
        out, self.sent = self.sent, []
        return out

    def test_seed_then_no_duplicates(self):
        src = Fake([item(1, 250_000), item(2, 500_000)])
        first = self.cycle(src)
        self.assertEqual(len(first), 1)
        self.assertIn("Start", first[0])
        self.assertEqual(self.cycle(src), [])            # 2. Lauf: nichts Neues
        src.items.append(item(3, 280_000))
        self.assertEqual(len(self.cycle(src)), 1)        # neue Anzeige -> 1 Push
        self.assertEqual(self.cycle(src), [])

    def test_seed_beyond_detail_budget(self):
        src = Fake([item(i, 250_000) for i in range(5)])
        with mock.patch.object(run, "MAX_DETAILS_PER_SOURCE", 2):
            self.assertEqual(len(self.cycle(src)), 1)    # nur die Start-Zusammenfassung
            self.assertEqual(self.cycle(src), [])        # Bestand ist komplett erfasst

    def test_price_drop(self):
        src = Fake([item(1, 250_000)])
        self.cycle(src)
        src.items.append(item(2, 400_000))
        self.cycle(src)                                  # zu teuer -> kein Push
        calls = src.detail_calls
        self.assertEqual(self.cycle(src), [])            # unverändert -> keine Detailabrufe
        self.assertEqual(src.detail_calls, calls)
        src.items[1] = item(2, 295_000)
        pushed = self.cycle(src)
        self.assertEqual(len(pushed), 1)
        self.assertIn("Preis gesenkt", pushed[0])
        self.assertEqual(self.cycle(src), [])            # nur einmal

    def test_gesuch_in_title(self):
        src = Fake([item(1, 250_000)])
        self.cycle(src)
        src.items.append(item(2, 250_000, title="4-Zimmer Eigentumswohnung (auch renovierungsbedürftig) gesucht."))
        self.assertEqual(self.cycle(src), [])

    def test_failure_alert_once(self):
        src = Fake([item(1, 250_000)])
        self.cycle(src)
        src.error = "HTTP 403"
        alerts = [self.cycle(src) for _ in range(run.FAIL_ALERT_AFTER + 2)]
        flat = [t for a in alerts for t in a]
        self.assertEqual(len(flat), 1)
        self.assertIn("ausgefallen", flat[0])
        src.error = None
        self.assertIn("läuft wieder", self.cycle(src)[0])


if __name__ == "__main__":
    unittest.main()
