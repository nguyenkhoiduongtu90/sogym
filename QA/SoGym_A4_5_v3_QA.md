# SoGym_A4_5_v3 — QA Report

**File:** `SoGym_A4_5_v3.html` (copied from `SoGym_A4_5_v2.html`, which was NOT modified — per "never edit a pending/confirmed version in place" rule).
**Service Worker:** unchanged, still registers `SW_A4_5_v1.js` (no SW-level behavior needed for these fixes — pure HTML/CSS/JS changes in the main file only, so no new SW version was created).
**Reason for this version:** user confirmed (informally, not yet the literal "A4.5_v2 OK" phrase) that the 2 issues fixed in v2 look resolved, then reported 3 new issues found during continued real usage. This report covers **issues 2 and 3** (issue 1 — Favorites — is a new feature requiring a design-clarification question before implementation, and is intentionally not part of this version; see separate note to user).

## Issue 1 — Favorites (yêu thích)

**Design clarified with user via AskUserQuestion before implementing** (2 questions):
1. Mechanism → **kết hợp cả hai**: manual star toggle AND auto-tag after >3 uses in Lịch sử, with manual action always taking precedence (if user explicitly un-favorites an auto-tagged exercise, it stays un-favorited even if usage count keeps growing).
2. Sort order → favorites group first, **existing A-Z order preserved** within each group (no secondary "most-used first" sort).

**Data model:** extended the existing `customOverrides[id]` structure (same place `nameVi`/`subgroup`/`equipGroup`/`equipDetail` overrides already live — no new top-level data structure, consistent with the established Data Schema) with a new field `favoriteManual` (`true` = user starred it, `false` = user explicitly un-starred it — a real tri-state distinct from "never touched", `undefined` = no manual action taken yet).

**Logic (`isFavorite(ex)`):**
- `favoriteManual === true` → favorite (manual always wins).
- `favoriteManual === false` → NOT favorite, even if history usage is >3 (respects an explicit "un-favorite" decision, does not re-auto-tag).
- otherwise → auto-favorite if `computeHistoryUsageCounts()[ex.id] > 3` (counts occurrences of the exercise's `catalogId` across all of `state.history`, computed once per `renderPicker()` call rather than per-exercise, to avoid re-scanning history 873 times on every keystroke).

**UI:** a ★/☆ button (`.fav-btn`) added to each row in màn Chọn bài's result list — gold `★` when favorite, gray outline `☆` when not, with `stopPropagation()` so tapping the star doesn't also select the exercise row. `renderPicker()`'s sort now places favorites first, falling back to the existing A-Z `localeCompare` order within each group.

**Real-browser tests (all PASS):**
| Test | Result |
|---|---|
| Never touched, 0 history uses → not favorite, shows ☆ | `favBeforeManual: false`, `starTextBefore: "☆"` ✅ |
| Manual star click → becomes favorite, icon flips to ★ | `favAfterManual: true`, `starTextAfter: "★"` ✅ |
| Never manually touched, used 4× in Lịch sử (>3) → auto-favorite | `favB_autoTagged: true` ✅ |
| Manually un-favorite an auto-tagged exercise → stays NOT favorite even though usage count is still >3 | `favB_afterManualUnfav: false` ✅ |
| Used only 2× (≤3) → not favorite | `favC_notEnoughUses: false` ✅ |
| Sort: 2 manually-favorited exercises among a 28-item filtered list correctly float to the top, in correct Vietnamese-locale A-Z order between themselves | `firstNFavNames` = `["Calves-SMR", "Đẩy chân (máy) - Máy chuyên biệt"]`, matches expected sorted set exactly ✅ |
| Remaining 26 non-favorite items keep their original A-Z order below the favorites | verified — full 26-item list confirmed alphabetically ordered ✅ |
| Favorite state persists through `saveState()` + real page reload (localStorage round-trip) | `persistedFavoriteManual: true` after `location.reload()` ✅ |
| No console errors after all favorites interactions | none ✅ |

## Issue 2 — Nhập set: copy reps/kg from the previous set

**Request:** after the first set, when tired, user wants a button to copy the previous set's reps/kg into the new set's inputs instead of retyping — but still be able to manually edit afterward if the copied values aren't right.

**Solution chosen:** a small circular "⧉" button (`.copy-prev-btn`) placed in the 4th grid column of the new-set input row (previously an unused `—` placeholder shown there). It only appears once at least 1 set has already been logged for the current exercise. Its `title` attribute previews exactly what it will copy (e.g. "Copy 12 reps / 35.5kg từ set trước") for extra clarity before tapping. Clicking it fills `#inpReps` and `#inpWeight` with the last logged set's values — but the fields remain completely normal, still-editable `<input>` elements, so the user can freely overwrite them by hand afterward, satisfying the explicit requirement.

**Real-browser tests (mobile viewport 375×812, all PASS):**
| Test | Result |
|---|---|
| No sets logged yet → old `—` placeholder still shown, no copy button | `noBtnBeforeAnySet: true`, `placeholderShownBeforeAnySet: true` ✅ |
| After logging 1st set (reps=12, weight=35.5) → button appears | `hasBtnAfterFirstSet: true` ✅ |
| Button title previews correct values | `btnTitle: "Copy 12 reps / 35.5kg từ set trước"` ✅ |
| Clicking button copies both values into the inputs | `copiedReps: "12"`, `copiedWeight: "35.5"` ✅ |
| Inputs remain manually editable after copy (not locked/readonly) | fields are plain `<input>` elements, no `readonly`/`disabled` attribute added ✅ |

## Issue 3 — Rest timer allegedly overlapping the bottom navbar when scrolling

**Investigation:** built a full inventory of every `position:fixed` element in the file via Grep (`.navbar`, `#saveErrorBanner`, `#multiTabBanner`, `#staleSessionBanner`, `#restDoneBanner`, `#splashScreen`) — no rogue/duplicate floating timer widget exists anywhere in the code; the countdown ring (`.rest-timer`/`.ring`) itself sits in **normal document flow**, not fixed/absolute positioning, so it cannot visually float over the navbar by itself.

Attempted to reproduce the reported bug in real headless-Chromium testing across multiple realistic scenarios: 3 exercises pre-loaded with multiple sets each, rest timer actively running (`state.restRunning = true`), scrolled all the way to `document.body.scrollHeight`. In every scenario, `document.elementFromPoint()` hit-testing confirmed all 4 navbar tabs (Hôm nay / Chọn bài / Nhập set / Lịch sử) were correctly hit-testable and clickable — **could not reproduce the reported overlap in this tool.**

**Conclusion:** root cause not confirmed. Strongly suspected to be an iOS-Safari-specific rendering quirk (the well-known WebKit "dynamic address bar + `position:fixed`" glitch during scroll), which cannot be reproduced in desktop headless Chromium.

**Fix applied (defensive hardening, safe regardless of root cause):**
```css
.navbar{ ... z-index:60; -webkit-transform:translateZ(0); transform:translateZ(0) }
```
(previously had no explicit `z-index` and no compositing hint). `z-index:60` is now the highest of any fixed element in the app (previous highest was `#splashScreen` at 999 which is a one-time load screen, and `#restDoneBanner` at 51 which now sits below the navbar). The `translateZ(0)` forces the browser to promote `.navbar` to its own GPU compositing layer, which is a common practical mitigation for the WebKit fixed-position-during-scroll glitch.

**Real-browser regression re-test after the hardening fix (mobile viewport 375×812, all PASS):**
| Test | Result |
|---|---|
| 3 exercises, multiple sets each, active countdown, scrolled to `document.body.scrollHeight` (1155px) | all 4 nav tabs hit-test to themselves (`reaches: true`) ✅ |
| `.navbar` computed `z-index` | `60` (highest among interactive/persistent fixed elements) ✅ |
| `.navbar` computed `transform` | GPU compositing layer active (`matrix(1,0,0,1,0,0)`, promoted) ✅ |
| No new console errors after fix | none ✅ |
| `#restDoneBanner` z-index still below navbar (51 < 60), no stacking regression | ✅ |

**Honest disclosure:** this issue is being shipped as a **hardening fix, not a confirmed bug fix** — the reported behavior could not be reproduced in any tested scenario here. **User verification on a real iPhone is needed** to confirm whether this resolves the issue in practice.

## Regression check — v2 fixes carried forward unchanged
| Test | Result |
|---|---|
| Search "lưng cable" (tokenized AND-match, from A4.5_v2) | 19 results ✅ |
| Search "lung" (119 results) — internal scroll layout (from A4.5_v2) | list scrolls internally (`scrollHeight: 10286px` in `clientHeight: 355px` box), body only 894px tall, `.picker-action-bar` still `position: sticky` ✅ |

## Status
All 3 newly-reported issues investigated and addressed: Issue 1 (Favorites) and Issue 2 (copy-previous-set) fully implemented and verified with PASS on every test; Issue 3 (navbar overlap) hardened defensively but root cause could not be reproduced/confirmed in available testing tools. No regressions found in A4.5_v2's search/layout fixes, or between the 3 new changes themselves.

**Awaiting user's "A4.5_v3 OK"** before this becomes the confirmed baseline. Separately, **real-iPhone verification is requested for Issue 3** specifically, since its fix is a hardening measure, not a confirmed root-cause fix.
