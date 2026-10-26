Status: ready-for-agent (local only, not published to an issue tracker)

## Problem Statement

I want to do interval workouts (rounds of work and rest) without watching my phone. Existing timer apps are cluttered, need accounts or ads, or give unclear audible cues. I need a simple, minimal timer on my iPhone that I can set up in seconds, put down, and follow by sound.

## Solution

A frontend-only, installable, offline-capable PWA. The user sets rounds, work duration and rest duration, then taps Start. After a 3-second get-ready countdown, work and rest phases alternate for each round, with no rest after the final round. A large countdown, the current phase (with a colour change) and the round number are shown. Before every transition, including the end of the workout, soft beeps play at 3, 2 and 1 seconds and a louder, higher beep at 0. The screen is kept awake while the timer runs. Last-used settings are remembered.

## User Stories

1. As a workout user, I want to set the number of rounds, so that the session matches my plan.
2. As a workout user, I want to set the work duration per round, so that I can control intensity.
3. As a workout user, I want to set the rest duration per round, so that I can control recovery.
4. As a workout user, I want large tap targets for adjusting values, so that I can use them with sweaty hands.
5. As a workout user, I want zero, negative or non-integer values rejected with a clear message, so that I never start a broken workout.
6. As a workout user, I want my last-used settings remembered, so that I don't re-enter them.
7. As a workout user, I want corrupt stored settings ignored in favour of defaults, so that the app never breaks on load.
8. As a workout user, I want a single obvious Start button, so that I can begin without menus.
9. As a workout user, I want a 3-second get-ready countdown before round 1, so that I can get into position.
10. As a workout user, I want a large, high-contrast countdown of the time left in the phase, so that I can read it from a distance.
11. As a workout user, I want the phase labelled WORK or REST, so that I know what to do at a glance.
12. As a workout user, I want the background colour to change between work and rest, so that I can tell the phase without reading.
13. As a workout user, I want to see "round X of Y", so that I know my progress.
14. As a workout user, I want soft beeps at 3, 2 and 1 seconds before each transition, so that I'm warned without being startled.
15. As a workout user, I want a louder, higher beep when the next phase starts, so that I can't miss the change.
16. As a workout user, I want the same beep pattern for work to rest, rest to work and workout end, so that cues are consistent.
17. As a workout user, I want the final round to end without a rest, so that I'm not made to wait after my last effort.
18. As a workout user, I want a clear "done" state at the end, so that I know the workout is over.
19. As a workout user, I want to pause and resume, so that I can handle interruptions without losing my place.
20. As a workout user, I want pausing to freeze time exactly, so that remaining time is correct after resuming.
21. As a workout user, I want to stop and return to setup, so that I can change settings or abandon a session.
22. As a workout user with phases of 3 seconds or less, I want beeps clipped to fit the phase, so that cues still make sense.
23. As an iPhone user, I want the screen kept awake while the timer runs, so that the timer and audio keep working.
24. As an iPhone user, I want the wake lock re-acquired when I return to the app, so that the screen stays on again.
25. As an iPhone user, I want a "keep screen on" hint at start, so that I know not to lock the phone.
26. As an iPhone user, I want correct time after the page was hidden, so that the timer doesn't drift, and no beep fires twice or is skipped.
27. As an iPhone user, I want audio to work after tapping Start, so that iOS autoplay restrictions don't silence beeps.
28. As an iPhone user, I want to add the app to my Home Screen and launch it full-screen, so that it feels native.
29. As a gym user with poor signal, I want full offline use after first load, so that I don't depend on connectivity.
30. As a user, I want it to work on Android and desktop browsers too, so that I'm not limited to one device.
31. As a user, I want a dark, minimal single-screen interface, so that it is not distracting.
32. As a user, I want no accounts, ads or tracking, so that my privacy is respected.
33. As a user, I want updates picked up automatically when online, so that I get fixes without reinstalling.

## Implementation Decisions

- Single primary seam: the **timer engine**. Its public interface takes workout settings (rounds, work seconds, rest seconds, fixed 3-second get-ready) and elapsed milliseconds, and returns the current phase, round, seconds remaining, beeps due since the previous elapsed time, and a finished flag.
- Phase scheduling lives behind the timer engine as an internal detail: an ordered list of phases (get-ready, then work/rest per round, no rest after the final round). Invalid settings (non-positive, non-integer) raise explicit errors (fail fast).
- Time comes from timestamps, never tick counting. Pause and resume work through accumulated elapsed time.
- Beep rule: soft beeps at 3, 2, 1 seconds remaining, a loud beep at 0, on every transition including workout end. Beeps are clipped for phases of 3 seconds or less. Each beep fires exactly once, even when a tick jumps across several boundaries.
- Secondary seam: the **settings store**. It loads and saves rounds, work and rest in browser local storage, validates them, applies defaults, and ignores corrupt or out-of-range data.
- Shallow, manually verified modules: beeper (audio context created and unlocked on the Start tap; soft and loud beeps, loud is higher in pitch and volume), wake lock manager (acquire on start, release on stop or finish, re-acquire on visibility return, graceful when unsupported), UI layer (setup and running screens, start, pause/resume, stop; a roughly 100ms tick loop drives engine and beeper), PWA shell (manifest, icons, offline service worker).
- Screen-off strategy: Wake Lock only. No silent-audio trick, no pre-scheduled audio. Beeps with the screen locked are best-effort.
- The same work and rest apply to every round. No warm-up or cooldown. No skip control.
- Visual design: dark, high-contrast, large countdown, different WORK and REST colours.
- Stack: Vite with vanilla TypeScript, as in `PRD.md`. The existing plain HTML/JS/CSS code is a throwaway draft and is to be replaced, not built upon. The engine and settings store must be importable in isolation for testing.
- Hosting and deployment (GitHub Pages subpath handling, CI) are deferred until a repository exists.

## Testing Decisions

- A good test exercises only external behaviour through a public interface (inputs and outputs), so it survives refactoring. It never asserts on internal phase lists or helpers.
- Test the timer engine through its public interface: phase, round and remaining time at given elapsed times; phase boundaries; no rest after the last round; pause/resume; each beep exactly once including across skipped boundaries; clipped beeps for short phases; finished state; rejection of invalid settings.
- Test the settings store: save/load round-trip, defaults when empty, corrupt and out-of-range data.
- Use Vitest.
- Not automatically tested: beeper, wake lock, UI and PWA shell. Verify manually on a real iPhone: audio after Start, wake lock re-acquisition, Add to Home Screen, offline launch.
- Prior art: none in this codebase.

## Out of Scope

- Guaranteed beeps or timing with the screen locked or the app backgrounded.
- Per-round variable durations, warm-up and cooldown phases.
- Skip forward and back.
- Presets, history, statistics, accounts.
- Vibration and voice cues.
- Light theme and localisation.
- App store distribution, backend or sync.
- GitHub Pages deployment (until a repository exists).

## Further Notes

- iOS Safari requires a user gesture to start audio, so the audio context is created on the Start tap.
- This spec refines `PRD.md` and `client-brief.md`. Where they differ, this spec's seam and scope decisions apply.
- Not yet published to an issue tracker. Once one is configured, publish with the `ready-for-agent` label.
