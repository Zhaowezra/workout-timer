# 04: Settings store

**What to build:** Last-used rounds, work and rest durations are saved to and loaded from browser local storage, with validation. See `SPEC.md`.

**Blocked by:** 01: Project scaffold with test runner

**Status:** done

- [x] Saved values round-trip through load
- [x] Sensible defaults are returned when nothing is stored
- [x] Corrupt or out-of-range stored data is ignored in favour of defaults
- [x] Tests exercise only the public interface
