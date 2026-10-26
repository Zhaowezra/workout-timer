# 05: Running workout in the browser (UI, beeper, wake lock)

**What to build:** A user can set up and run a full workout. Setup screen with large tap targets and clear messages for invalid values, and settings remembered. Start unlocks audio. The running screen shows a large countdown, WORK/REST label and colour, and "round X of Y". Pause/resume and stop work, and a done state is shown at the end. Beeps play from the engine, a roughly 100ms tick loop drives it, the screen stays awake, the wake lock is re-acquired when the page becomes visible, and a "keep screen on" hint is shown at start. Verified manually. See `SPEC.md`.

**Blocked by:** 02: Timer engine: schedule, phases and countdown; 03: Timer engine: beeps and pause/resume; 04: Settings store

**Status:** implemented, awaiting manual verification (build, tests and dev server pass; audio/wake lock/UI not browser-tested)

- [x] Invalid settings are rejected with a clear message and the workout does not start
- [ ] A full workout runs end to end with correct phases, colours and round display
- [ ] Soft beeps at 3, 2, 1 and a louder, higher beep at 0 play on every transition and at the end
- [ ] Audio works after tapping Start on iOS Safari
- [ ] The wake lock is held while running, released on stop or finish, and re-acquired on return; the app degrades gracefully if unsupported
- [ ] Time is correct after the page was hidden and shown again
- [ ] Pause, resume and stop behave as specified

Note: only the validation criterion is ticked (logic reviewed; build passes). All other criteria need manual browser/iPhone verification.
