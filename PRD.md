## Problem Statement

I want to do interval workouts (a number of rounds of work and rest) without watching my phone. Existing timer apps are cluttered, need accounts or ads, or don't give clear audible cues. I need a simple, minimal timer on my iPhone that I can set up in seconds, put down, and follow by sound, with a gentle countdown before each change and a clear signal when the next phase starts.

## Solution

A frontend-only, installable, offline-capable PWA, hosted on GitHub Pages. The user sets the number of rounds, work duration and rest duration, then taps Start. After a 3-second get-ready countdown, the app runs work and rest phases for each round, skipping the rest after the final round. It shows a large countdown, the current phase (with a colour change) and the round number. Before every transition (including the end of the workout) it plays soft beeps at 3, 2 and 1 seconds and a louder, higher beep at 0. The screen is kept awake with the Screen Wake Lock API while the timer runs. Last-used settings are remembered.

## User Stories

1. As a workout user, I want to set the number of rounds, so that the session matches my plan.
2. As a workout user, I want to set the work duration per round, so that I can control the intensity.
3. As a workout user, I want to set the rest duration per round, so that I can control recovery.
4. As a workout user, I want number steppers or mm:ss inputs with large tap targets, so that I can adjust values quickly with sweaty hands.
5. As a workout user, I want invalid values (zero or negative rounds or durations) to be rejected with a clear message, so that I never start a broken workout.
6. As a workout user, I want my last-used settings remembered, so that I don't re-enter them each session.
7. As a workout user, I want a single obvious Start button, so that I can begin without navigating menus.
8. As a workout user, I want a 3-second get-ready countdown before round 1, so that I can put the phone down and get into position.
9. As a workout user, I want a large, high-contrast countdown of the time left in the current phase, so that I can read it from a distance.
10. As a workout user, I want the phase clearly labelled WORK or REST, so that I know what to do at a glance.
11. As a workout user, I want the background colour to change between work and rest, so that I can tell the phase without reading.
12. As a workout user, I want to see "round X of Y", so that I know my progress.
13. As a workout user, I want soft beeps at 3, 2 and 1 seconds before each transition, so that I'm warned without being startled.
14. As a workout user, I want a louder, higher beep at the moment the next phase starts, so that I can't miss the change.
15. As a workout user, I want the same beep pattern on work to rest, rest to work and the end of the workout, so that the cues are consistent.
16. As a workout user, I want the final round to end without a rest, so that I'm not made to wait after my last effort.
17. As a workout user, I want a clear "done" state when the workout finishes, so that I know it's over.
18. As a workout user, I want to pause and resume, so that I can handle interruptions without losing my place.
19. As a workout user, I want to stop and reset to the setup screen, so that I can change settings or abandon a session.
20. As a workout user, I want pausing to freeze time exactly, so that the remaining time is correct after resuming.
21. As a workout user with very short phases (3 seconds or less), I want the beeps clipped to fit the phase, so that the cues still make sense.
22. As an iPhone user, I want the screen kept awake while the timer runs, so that the timer and audio keep working.
23. As an iPhone user, I want the wake lock re-acquired when I return to the app after switching away, so that the screen stays on again.
24. As an iPhone user, I want to see a small "keep screen on" hint when I start, so that I know not to lock the phone.
25. As an iPhone user, I want the timer to show the correct time when I return after the page was hidden, so that it doesn't drift.
26. As an iPhone user, I want audio to work after tapping Start, so that iOS autoplay restrictions don't silence the beeps.
27. As an iPhone user, I want to add the app to my Home Screen and launch it full-screen, so that it feels like a native app.
28. As a user at the gym with poor signal, I want the app to work fully offline after the first load, so that I don't depend on connectivity.
29. As a user, I want the app to work on Android and desktop browsers too, so that I'm not limited to one device.
30. As a user, I want a dark, minimal interface with a single screen of controls, so that it is not distracting.
31. As a user, I want no accounts, ads or tracking, so that my privacy is respected.
32. As a user, I want app updates to be picked up automatically when online, so that I get fixes without reinstalling.
33. As the developer, I want every push to main to build and deploy to GitHub Pages automatically, so that releases are effortless.
34. As the developer, I want the app to work under the repository subpath on GitHub Pages, so that installation and offline caching work correctly.

## Implementation Decisions

- Stack: Vite with vanilla TypeScript, a service worker and a web manifest. There is no UI framework.
- Modules:
  - **Workout schedule builder** (deep, pure): turns rounds, work seconds, rest seconds and get-ready seconds into an ordered list of phases. There is no rest after the final round. Validation rejects non-positive and non-integer inputs with explicit errors (fail fast).
  - **Timer engine** (deep, pure): given a schedule and elapsed milliseconds, returns the current phase, round, seconds remaining and finished flag. It also reports which beeps are due between a previous and a current elapsed time, each beep firing exactly once. Time comes from timestamps, never tick counting, and pause/resume is handled through accumulated elapsed time.
  - **Beeper** (shallow): creates and unlocks the audio context on the Start tap, and exposes soft and loud beeps (the loud one is higher in pitch and volume).
  - **Wake lock manager** (shallow): acquires the lock on start, releases it on stop or finish, and re-acquires it when the page becomes visible again. It degrades gracefully when the API is unsupported.
  - **Settings store**: loads and saves last-used rounds, work and rest, with validation and sensible defaults. It ignores corrupt stored data.
  - **UI layer**: a setup screen and a running screen, with start, pause/resume and stop/reset controls. A tick loop of roughly 100ms drives the engine and the beeper.
  - **PWA shell and deployment**: manifest, icons, offline service worker, relative base path so everything works under the repository subpath, and a GitHub Actions workflow that builds and deploys with the official Pages deploy action on every push to main.
- Screen-off strategy: Wake Lock only. The screen stays on while the timer runs. There is no silent-audio trick and no pre-scheduled audio. Beeps while the screen is off are best-effort and not guaranteed on iOS.
- Beep rule: soft beeps at 3, 2 and 1 seconds remaining and a loud beep at 0 on every transition, including the end of the workout. For phases of 3 seconds or less, beeps are clipped to fit the phase.
- Phase model: the same work and rest apply to every round. There is no warm-up or cooldown. A fixed 3-second get-ready phase comes before round 1.
- Controls: start, pause/resume and stop/reset only. There is no skip.
- Persistence: last-used settings only, in browser local storage. There are no presets or history.
- Visual design: dark, high-contrast theme, large tap targets, a large countdown, and phase colours that differ between WORK and REST.
- Hosting: a public GitHub repository named `workout-timer`, served via GitHub Pages over HTTPS.

## Testing Decisions

- A good test exercises only external behaviour through a module's public interface (inputs and outputs), not its internals, so it survives refactoring.
- Modules to test: the workout schedule builder, the timer engine and the settings store, using Vitest.
  - Schedule builder: phase order and count, no rest after the last round, rejection of invalid inputs.
  - Timer engine: correct phase and remaining time at given elapsed times, phase boundaries, pause/resume behaviour, each beep firing exactly once (including when a tick skips past a boundary after the page was hidden), clipped beeps for phases of 3 seconds or less, and the finished state.
  - Settings store: round-trip of saved values, defaults when nothing is stored, and handling of corrupt or out-of-range stored data.
- Not automatically tested: the Beeper, wake lock manager, UI layer and PWA shell. These depend on browser and iOS behaviour and are verified manually on a real iPhone, covering audio after Start, wake lock re-acquisition, Add to Home Screen, offline launch and deployment under the subpath.
- Prior art: there is none, since this is a new codebase.

## Out of Scope

- Guaranteed beeps and timing with the screen locked or the app backgrounded, particularly on iOS.
- Per-round variable work and rest, warm-up and cooldown phases.
- Skip-forward and skip-back controls.
- Presets, workout history, statistics and accounts.
- Vibration and voice cues.
- Light theme and localisation.
- Native app store distribution.
- Any backend or sync.

## Further Notes

- iOS Safari requires a user gesture to start audio, so the audio context is created on the Start tap.
- GitHub Pages project sites are served from a subpath, so the base path, manifest scope and start URL and service worker scope must all account for it.
- Free GitHub Pages requires a public repository.
- This file is a local draft. Once the repository exists, file it as a GitHub issue.
