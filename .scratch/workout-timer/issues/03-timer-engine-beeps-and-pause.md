# 03: Timer engine: beeps and pause/resume

**What to build:** The engine also reports which beeps are due between a previous and a current elapsed time: soft at 3, 2, 1 seconds remaining and loud at 0, on every transition including workout end. Pause and resume work through accumulated elapsed time. See `SPEC.md`.

**Blocked by:** 02: Timer engine: schedule, phases and countdown

**Status:** done

- [x] Each beep fires exactly once, including when a tick jumps across one or more boundaries (page was hidden)
- [x] Beeps are clipped to fit phases of 3 seconds or less
- [x] The loud beep fires at workout end as well as at phase changes
- [x] Pausing freezes time exactly, and remaining time is correct after resuming
- [x] Tests exercise only the public interface
