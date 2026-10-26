# 02: Timer engine: schedule, phases and countdown

**What to build:** The timer engine's public interface. Given workout settings (rounds, work seconds, rest seconds, fixed 3-second get-ready) and elapsed milliseconds, it returns the current phase (get-ready, work, rest, done), round, seconds remaining and a finished flag. The phase schedule is an internal detail. See `SPEC.md`.

**Blocked by:** 01: Project scaffold with test runner

**Status:** ready-for-agent

- [ ] Correct phase, round and remaining seconds at given elapsed times, including phase boundaries
- [ ] No rest after the final round
- [ ] The finished state is reported after the last work phase
- [ ] Non-positive or non-integer settings raise explicit errors
- [ ] Tests exercise only the public interface
