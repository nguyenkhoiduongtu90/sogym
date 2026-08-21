# SoGym_A4_5_v4 — QA Report

**File:** `SoGym_A4_5_v4.html` (copied from `SoGym_A4_5_v3.html`, which was NOT modified — per "never edit a pending/confirmed version in place" rule).
**Service Worker:** unchanged, still registers `SW_A4_5_v1.js` (no SW-level behavior needed for these fixes).
**Reason for this version:** user reported 2 more issues after receiving `A4.5_v3.html`'s report (Favorites, copy-prev-set, navbar hardening), both related to the new Favorites feature from v3.

**Process note:** the first attempt at these fixes was mistakenly made by editing `SoGym_A4_5_v3.html` directly, which violates the "never edit an already-delivered/pending version in place" rule (v3 had already been reported to the user with its own QA doc). This was caught before reporting back: the two edits were reverted out of `v3.html` (restoring it byte-for-byte to its originally-delivered state), and a proper `SoGym_A4_5_v4.html` copy was made instead to carry the fixes. Documented here for transparency.

## Issue 1 — Favorites: starring in Chọn bài immediately jumped the item to the top of the list

**Root cause:** the star button's click handler called `renderPicker()` right after `toggleFavoriteManual()`, which re-runs the full filter+sort (favorites-first) and re-renders the list — so the just-starred exercise immediately jumped to the top of the *current* search results, before the user had a chance to tap it to add to the session. User's expectation: starring shouldn't move the item within the list the user is currently looking at; the favorites-first ordering should only take effect on the *next* search/render.

**Fix:** the star click handler in `renderPicker()` no longer calls `renderPicker()`/`renderDetailBox()`. It only updates that single button's icon (☆→★ or back) and `is-fav` class in place via direct DOM manipulation — the list's current DOM order is left untouched. The favorites-first sort still runs normally the next time `renderPicker()` is triggered by an actual render event (typing in search, changing the equipment chip/subgroup filter, or reopening the Chọn bài screen).

**Real-browser tests (all PASS):**
| Test | Result |
|---|---|
| Star an item mid-list (not the first item) in a 28-item filtered result | icon flips `☆`→`★` correctly |
| List DOM order immediately after the star click | **unchanged** — `samePositionAsBefore: true` |
| Re-triggering `renderPicker()` (simulating the next search) | starred item now correctly appears **first** — `targetIsFirstAfterResort: true` |

## Issue 2 — Favorites: add a star button on tab Hôm nay too (fewer items, easier to find)

**Fix:** added the same `.fav-btn` (★/☆) to each exercise row in `#exerciseList` (`renderHome()`), reusing the exact same `isFavorite()`/`toggleFavoriteManual()` logic and `customOverrides[id].favoriteManual` data as the Chọn bài screen — starring in either screen updates the same underlying favorite state. Clicking the star uses `stopPropagation()` + an explicit guard (`e.target.closest('[data-fav]')`) so it does not also trigger opening the Nhập set screen for that exercise (which is the row's normal click behavior). Today's session list (`state.sessionExercises`) is intentionally **not** re-sorted by favorite status — it keeps the user's add-order, since it's an active workout list, not a search/browse list, so there's no "jump to top" concern here at all.

**Real-browser tests (all PASS):**
| Test | Result |
|---|---|
| 3 exercises added to today's session → 3 star buttons appear in `#exerciseList` | `hasFavBtns: true` |
| Clicking a star toggles the icon | `☆` → `★` |
| Clicking a star does **not** navigate to the Nhập set screen | `screenAfterClick: "screen-home"` (stayed on Home) |
| Session list order unchanged after starring (no resort) | `orderUnchanged: true` |
| Favorite set from tab Hôm nay is reflected correctly back in tab Chọn bài (shared data) | searching for that exercise in Chọn bài shows `is-fav` class ✅ |

## Regression check — all prior fixes (v2 + v3) carried forward unchanged
| Test | Result |
|---|---|
| Tokenized search "lưng cable" (A4.5_v2) | 19 results ✅ |
| Scrollable picker list + sticky action bar (A4.5_v2) | list scrolls internally (11099px in capped box), body only 894px tall, action bar `position: sticky` ✅ |
| Navbar hardening `z-index:60` (A4.5_v3) | still present, unchanged ✅ |
| Copy-previous-set button (A4.5_v3) | still appears after 1st set, correctly copies reps/weight into editable inputs ✅ |
| No console errors across all tests | none ✅ |

## Status
Both newly-reported Favorites issues fixed and verified via real headless-Chromium browser testing. No regressions found in any prior A4.5 fix (v2 search/layout, v3 copy-set/navbar-hardening/favorites-core-logic).

**Awaiting user's "A4.5_v4 OK"**. Issue 3 from `v3` (rest-timer/navbar overlap) remains a hardening-only fix with unconfirmed root cause — still awaiting real-iPhone verification from the user, unchanged from v3's status.
