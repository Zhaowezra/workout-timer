# 06: Installable offline PWA

**What to build:** The app can be added to the iPhone Home Screen, launched full-screen, and used fully offline after first load. Updates are picked up automatically when online. See `SPEC.md`.

**Blocked by:** 05: Running workout in the browser (UI, beeper, wake lock)

**Status:** ready-for-agent

- [ ] A web manifest and icons exist, with scope and start URL working under a subpath
- [ ] A service worker caches the app so it launches and runs offline
- [ ] A new version is picked up automatically when online
- [ ] Verified manually on a real iPhone: Add to Home Screen, full-screen launch, offline launch
