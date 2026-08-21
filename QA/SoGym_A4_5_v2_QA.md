# SoGym_A4_5_v2 — QA Report

**File:** `SoGym_A4_5_v2.html` (copied from `SoGym_A4_5_v1.html`, which was NOT modified — per "never edit a pending/confirmed version in place" rule).
**Service Worker:** unchanged, still registers `SW_A4_5_v1.js` (no SW-level behavior needed for these fixes — pure HTML/CSS/JS changes in the main file only, so no new SW version was created).
**Reason for this version:** user reported 2 real-usage bugs while testing `SoGym_A4_5_v1.html`. Both root-caused, fix approach confirmed with user via AskUserQuestion before implementing, then implemented and re-tested in a real headless-Chromium preview (`sogym-static`, port 8934) at mobile viewport 375×812.

## Issue 1 — Search: multi-word query returned 0 results ("lưng cable")

**Root cause:** in `renderPicker()`, the search logic (originally written in step A4.4, confirmed OK) matched the **entire typed query as one literal substring** (`normalizeVi(name).indexOf(qn)`) against `name`/`sub`/`nameEn`. A two-word query like "lưng cable" only matches if that exact phrase appears contiguously in a single field — which almost never happens when the two words belong to different attributes of the exercise (muscle group vs. equipment).

**Process note:** since this bug's root cause lives in code delivered as part of already-confirmed `A4.4_v1`, the user was asked whether to formally ship `SoGym_A4_4_v2.html` first (per the "stay on step, ship new version" rule) or patch directly here. **User's decision: patch directly in A4.5 (skip a formal A4.4_v2)** — documented so the precedent is clear for future similar cases.

**Fix:** query is now split on whitespace into tokens; each token must match (case/diacritic-insensitive substring) **somewhere** across `name` OR `sub` OR `nameEn` OR the full equipment display (`resolvedEquipmentDisplay()` = equipGroup + equipDetail) — tokens are AND'd together, fields are OR'd per token. Per user's explicit choice, search scope was also **expanded to include equipment text** (previously not searched at all).

**Real-browser tests (all PASS):**
| Test | Query | Expected | Result |
|---|---|---|---|
| Exact reported bug | `lưng cable` | >0 relevant results (lat/back rows on cable machines) | **19 results**, e.g. "Kéo lưng (Row) - Máy cáp (Cable)" ✅ |
| Diacritic-insensitive regression (A4.4 behavior preserved) | `gap bung` (no dấu) | Same as "gập bụng" | **31 results**, all "Gập bụng (Crunch)" ✅ |
| New equipment-field search scope | `bodyweight` (only present in one exercise's `equipDetail`, not in its name/sub/nameEn) | That exercise now found | **114 results, includes `3_4_Sit-Up`** ✅ (previously would have been excluded — equipment text wasn't searched before) |
| Zero-result state still works | `zzzxxxqqq123` | "Không tìm thấy bài phù hợp." | ✅ |
| Empty query + no filter still shows guidance, not full 873 | (empty) | Guidance message, 0 DOM items | ✅ |
| Chip filter alone (no text) still works | chip=`Máy cáp` | Only cable-machine exercises | **81 results**, all confirmed `equipGroup==='Máy cáp'` ✅ |
| Chip + text AND logic still correct | chip=`Máy cáp` + `lung` | Subset of the 81 that also mention "lưng"/"lung" | **19 results**, 100% still cable-machine ✅ |
| Chip with genuinely 0 matches (data fact, not a bug) | chip=`Máy Smith` | 0 results | **0 results** — verified independently: catalog currently has 0 exercises tagged `Máy Smith` at all (pre-existing data state, unrelated to this fix; `matchEquip` logic itself was not touched) |

## Issue 2 — Layout: long result list pushed detail/Add button far off-screen

**Root cause:** `.screen{padding:18px 16px 8px}` has no scroll containment — `#pickerList` rendered directly in normal document flow, so a long result list (e.g. 119 items) grew the whole page to ~10,000px tall, pushing `#detailCard` and `#btnAddToSession` far below the fold. Confirmed as a **real bug on an actual mobile-sized viewport** (375×812), not a desktop-preview-only artifact — measured on `A4.5_v1` before the fix: list 9941px tall, total page scroll 10643px vs. 812px viewport.

**Fix (per user-approved design):**
- `#pickerList` is now wrapped in `.picker-list-scroll` (`max-height:44vh; overflow-y:auto`) — the list scrolls **internally**, capped height, all items/images still fully present and reachable (nothing hidden or truncated, just scrolls in its own box).
- `#detailCard` + `#btnAddToSession` are now wrapped in `.picker-action-bar` (`position:sticky; bottom:84px` — 84px matches the existing reserved navbar clearance) so they stay visible near the bottom of the screen at all times, without needing to scroll through the list to reach them.

**Real-browser tests (mobile viewport 375×812, all PASS):**
| Test | Result |
|---|---|
| Search "lung" (119 results) — page no longer explodes in height | `document.documentElement.scrollHeight` = **894px** (was 10643px pre-fix) ✅ |
| List still internally scrollable, all 119 items reachable | `pickerListScroll.scrollHeight` = 10286px inside a `clientHeight` = 355px capped box (scrolls, nothing lost) ✅ |
| Action bar visible without scrolling, even with 119 results | `#pickerActionBar` sits at viewport y=658–728 (within 0–812) ✅ |
| Selecting an exercise (detailCard expands) — bar still fully visible, no scroll needed | bar y=462–728, still fully inside viewport ✅ — directly fixes "phải kéo hết dãy mới thấy" |
| Internal list scroll does not scroll the whole page (isolated scroll region) | `scrollBox.scrollTop` changed to 500 while `window.scrollY` stayed at 0 ✅ |

## Not covered / known limitation
- `preview_screenshot` timed out (~30s) while 119 lazily-loading images were pending — same behavior was already observed on `A4.5_v1` before this fix (not a regression introduced here). Did not investigate further per scope discipline; flagged as a pre-existing possible performance note, not part of the 2 reported issues.

## Status
Both reported issues reproduced, root-caused, fixed, and re-verified via real headless-Chromium browser testing (not just code reading). No regressions found in existing A4.4 search/filter/diacritic/empty-state/zero-result behavior.

**Awaiting user's "A4.5_v2 OK"** before this becomes the confirmed baseline. User mentioned 2 more issues will be reported after these 2 are resolved — those are out of scope for this version and will be handled in a subsequent version once reported.
