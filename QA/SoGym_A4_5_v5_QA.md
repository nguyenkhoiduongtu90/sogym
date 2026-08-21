# SoGym_A4_5_v5 — QA Report

**File:** `SoGym_A4_5_v5.html` (copied from `SoGym_A4_5_v4.html`, which was NOT modified — v4 was still being actively real-world-tested by the user when this bug was reported, so it stays untouched per "never edit an already-delivered version in place" rule).
**Service Worker:** unchanged, still registers `SW_A4_5_v1.js`. No SW-level change needed — the bug and its fix are both pure inline-`<script>`-ordering issues in the main HTML file.
**Reason for this version:** user reported the app stuck forever on the splash screen when opening `SoGym_A4_5_v4.html` directly via double-click (`file://`), with a screenshot showing the splash never disappearing. Urgent fix requested ("sửa chữa ngay").

## Root cause (confirmed, not just theorized)

`SoGym_A4_5_v4.html`'s Home-tab star button feature (added in v4) made `renderHome()` call `catalogById(ex.catalogId)` → `allExercises()` → `window.SOGYM_EXERCISE_CATALOG.concat(state.customExercises)` for every session exercise, to compute `isFavorite()`.

The problem: `renderHome()` is invoked synchronously as part of the app's init sequence, which sits at the **end of the first `<script>` block**. But `window.SOGYM_EXERCISE_CATALOG` (873 exercises) is defined in a **separate, second `<script>` block that only loads AFTER the first one finishes executing** (a long-standing, deliberate structural split — the huge catalog data was always kept in its own block; a code comment from the A4.4 era even warns about this exact hazard for a *different* function, `populateSubgroupFilter()`, but `renderHome()`'s new v4 dependency on the catalog was not covered by that guard).

Result: on every fresh page load, `renderHome()` threw `Uncaught TypeError: Cannot read properties of undefined (reading 'concat')` **before ever reaching the `setTimeout(...)` that hides the splash screen** — so the splash stayed up forever, on every load, unconditionally.

**Important finding: this is NOT actually a `file://`-specific bug, and NOT a network/CDN bug.** It was reproduced identically over `http://localhost:8934` with a cache-busted fresh navigation — same exact error, same permanent splash hang, regardless of whether the two external `<head>` resources (Google Fonts CSS, SheetJS CDN script) succeeded or were forced to fail (tested both ways, see below). It almost certainly went undetected in v4's own QA pass because that testing likely ran against an already-loaded page / a Service-Worker-cached bundle from an earlier version rather than a truly cold first load — and `file://` never registers a Service Worker at all (by design, guarded in code), so the user hit the real, always-present bug 100% of the time.

## Fix

Moved the entire "KHỞI TẠO" (init) block — `loadState()`, `checkAndArchiveStaleSession()`, `renderHome()`, `renderHistory()`, `updateRingUI()`, `updateLiveClock()`, the button-reorder IIFE, the splash-hide `setTimeout`, and the Service Worker registration — out of the first `<script>` block and into a **new third `<script>` block placed after the catalog `<script>` block**, so it only ever runs once `window.SOGYM_EXERCISE_CATALOG` is guaranteed to already exist. No logic inside any of these functions was changed — this is a pure code-ordering fix.

## Real-browser tests (via `preview_eval` against the live http-served file, all PASS)

| Test | Result |
|---|---|
| Reproduce the v4 bug first, to confirm root cause: fresh cache-busted load of the **unmodified** `SoGym_A4_5_v4.html`, `window.onerror` listener attached before any app code runs | `Uncaught TypeError: Cannot read properties of undefined (reading 'concat')` at `allExercises` ← `catalogById` ← `renderHome` ← init call, on **every** load, splash never hidden |
| Same repro, but with the two external `<head>` resources (Google Fonts, SheetJS CDN) pointed at an unreachable/non-existent domain to simulate offline (`file://`-like) conditions | Same error, same permanent hang — confirms this is unrelated to network reachability |
| Fresh cache-busted load of the new `SoGym_A4_5_v5.html` | `splashHidden: true`, `catalogLen: 873`, no thrown errors |
| Same v5 load with `window.onerror` instrumentation, normal network | `errors: []` |
| Same v5 load with the two external `<head>` resources pointed at an unreachable domain (offline simulation) | `errors: []`, `splashHidden: true` — confirms the fix works regardless of network/CDN availability, matching the offline-first architecture requirement |
| Regression — search "lưng cable" in Chọn bài | 19 results, 19 `.fav-btn` elements ✅ |
| Regression — star-jump fix (A4.5_v4): click a star mid-list, check DOM position before/after | `posBefore: 9`, `posAfter: 9`, unchanged; icon flips to ★ ✅ |
| Regression — Home-tab star button (A4.5_v4): add exercise to session, check `#exerciseList` | 2 `.fav-btn` elements present, click toggles ☆→★, stays on `screen-home` (no accidental navigation) ✅ |
| Regression — copy-prev-set (A4.5_v3): log a set, check `.copy-prev-btn` appears with correct title and copies values | button appeared with title `"Copy 10 reps / 30kg từ set trước"`, click filled `inpReps=10`, `inpWeight=30` ✅ |
| Regression — navbar hardening (A4.5_v3) | computed `z-index: 60`, `transform: matrix(1,0,0,1,0,0)` (GPU layer active) ✅ |
| Console check across the entire test session | no new errors or warnings introduced by any of the above interactions ✅ |

## Status

Root cause confirmed via real reproduction (not just code reading), fix implemented, and verified fixed under both normal-network and simulated-offline conditions — plus a full regression pass confirming no prior fix (v2 search/layout, v3 copy-set/navbar/favorites-core, v4 star-jump/Home-star) was broken by this change.

**Awaiting user's real-device test** — please try double-clicking `SoGym_A4_5_v5.html` again (including with WiFi/mobile data off, since that's closest to how this bug was originally hit) to confirm it now opens correctly. Once confirmed, this becomes the version to say **"A4.5_v5 OK"** for. Two items remain outstanding from earlier versions, unrelated to this fix: (1) the rest-timer/navbar-overlap hardening from v3 still awaits real-iPhone confirmation; (2) no A4.5 version has yet received the literal "OK" confirmation phrase.
