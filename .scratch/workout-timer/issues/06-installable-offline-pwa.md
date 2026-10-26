# 06: Installable offline PWA

**What to build:** The app can be added to the iPhone Home Screen, launched full-screen, and used fully offline after first load. Updates are picked up automatically when online. See `SPEC.md`.

**Blocked by:** 05: Running workout in the browser (UI, beeper, wake lock)

**Status:** awaiting manual verification (build passes; manifest/service worker/offline/iPhone install not browser-tested)

- [x] A web manifest and icons exist, with scope and start URL working under a subpath (relative `./`; served 200 via `vite preview`; not yet tried under a real subpath host)
- [x] A service worker caches the app so it launches and runs offline (implemented in `public/sw.js`; offline behaviour NOT yet exercised in a browser)
- [x] A new version is picked up automatically when online (network-first + skipWaiting/clients.claim; not yet exercised in a browser)
- [ ] Verified manually on a real iPhone: Add to Home Screen, full-screen launch, offline launch
