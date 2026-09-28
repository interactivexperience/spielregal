"""Persistenter Zustand (state.json, wird vom Workflow ins Repo zurückcommittet)."""
import json
import os
from datetime import datetime, timedelta, timezone

PRUNE_DAYS = 90


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(s: str | None) -> datetime | None:
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc) if s else None


class State:
    def __init__(self, path: str):
        self.path = path
        data = {}
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        self.seen: dict = data.get("seen", {})
        self.watch: dict = data.get("watch", {})
        self.health: dict = data.get("health", {})
        self.meta: dict = data.get("meta", {})
        self._orig = json.dumps(self._data(), sort_keys=True)

    def _data(self) -> dict:
        return {"seen": self.seen, "watch": self.watch, "health": self.health, "meta": self.meta}

    def source_known(self, source: str) -> bool:
        return any(k.startswith(source + ":") for k in self.seen)

    def prune(self) -> None:
        cutoff = now() - timedelta(days=PRUNE_DAYS)
        self.seen = {k: v for k, v in self.seen.items() if parse_iso(v.get("last")) and parse_iso(v["last"]) > cutoff}

    def save(self) -> bool:
        """Speichert nur bei inhaltlicher Änderung. Rückgabe: geändert?"""
        self.prune()
        data = self._data()
        if json.dumps(data, sort_keys=True) == self._orig:
            return False
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
            f.write("\n")
        return True
