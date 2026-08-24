# Sổ Gym — Final Audit + Optimization + Hardening: Báo cáo tổng kết

**Ngày hoàn tất:** 2026-08-24
**Baseline gốc (không bị ghi đè):** `SoGym_A9_v4.html` + `SW_A7_v2.js`
**Deliverable cuối cùng:** `SoGym_A_Final_Optimized_v1.html` + `SoGym_A_Final_Optimized_SW_v1.js`
**File làm việc trung gian (WIP, giữ lại làm audit trail):** `SoGym_A_Final_WIP.html` + `SW_A_Final_WIP.js`

Báo cáo này tuân theo đúng cấu trúc 11 mục quy định tại Section XX của prompt "Final Audit + Optimization + Hardening" gốc.

---

## 1. Những gì đã audit

Audit được thực hiện theo đúng quy trình 7 bước quy định trong prompt gốc (`sogym_final_audit_prompt.md`):

- **Bước 1 — Audit toàn diện** (`QA/SoGym_FinalAudit_Buoc1_Report.md`, 327 dòng): rà soát tĩnh + runtime trên 24 nhóm hạng mục (Nhóm 1–24), bao phủ: cấu trúc file/boot sequence, quản lý state (`localStorage`, schema versioning, normalize), toàn bộ luồng CRUD (buổi tập/set/bài tập/cơ thể/dinh dưỡng), render UI (Home/History/Picker/Chart/Goal), tìm kiếm/lọc trên 873 bài trong Exercise Database, export (Excel/Google Sheets), Service Worker + Cache Storage, an toàn XSS/escaping, hiệu năng khởi động, khả năng tương thích iPhone/Safari, an toàn dữ liệu khi phục hồi (restore từ file), và khả năng mở rộng cho Giai đoạn B.
- Sau vòng 1, thực hiện thêm **vòng audit sâu thứ 2 (Phần C)** để săn thêm lỗi tiềm ẩn (latent bugs) — phát hiện 7 lỗi mới (C1–C7) + 2 ghi chú phụ (C8–C9), đồng thời chủ động loại trừ 6 nghi vấn ban đầu tưởng là lỗi nhưng xác minh lại là an toàn (false positives).
- Runtime verification: cold-load timing, kiểm tra Cache Storage thực tế, test responsive/overflow trên nhiều kích thước màn hình, test hiệu năng search, test cố tình làm hỏng `localStorage` để xem hành vi lỗi, test khi mất mạng.
- Kết quả audit được tổng hợp thành 5 batch fix có thứ tự ưu tiên rõ ràng (`QA/SoGym_FinalAudit_HandoffNote.md`): Batch 1 (an toàn khi crash/toàn vẹn dữ liệu), Batch 2 (đúng đắn hiển thị/runtime), Batch 3 (hiệu năng/khởi động), Batch 4 (tương thích Safari di động), Batch 5 (dọn dẹp).

## 2. Những lỗi phát hiện

**Tổng quan (Executive Summary của Bước 1):** 🔴 2 Critical / 🟠 6 High / 🟡 ~13 Medium / 🟢 ~25+ Low-Clean / 🔵 ~7 Cosmetic.

**🔴 Critical:**
1. Boot sequence không có try/catch bao quanh `renderHistory()`/`renderHome()`/`checkAndArchiveStaleSession()` — chỉ cần 1 phần tử `history` hỏng có thể làm crash toàn bộ boot, splash screen treo vĩnh viễn không bao giờ ẩn.
2. 8 ảnh mascot nhúng base64 = 3,172,339 bytes = 66.5% tổng dung lượng file HTML, chặn parser đồng bộ ở **mọi** lần mở app.

**🟠 High (7 mục, gồm cả 1 phát hiện ở vòng 2):**
`loadState()` lỗi âm thầm không báo cho user; `runIntegrityCheck()` không chạy lúc boot; script SheetJS chặn đồng bộ trong `<head>`; `renderHistory()` không giới hạn chạy vô điều kiện lúc boot; SW cache HTML tăng trưởng không giới hạn; thiếu `viewport-fit=cover` (safe-area iPhone notch); và **C1** (Phần C) — thêm 1 đường crash-boot khác qua `computeHistoryUsageCounts()`/`allTimeMaxByExercise()` không guard chính `sess`.

**🟡 Medium (đáng chú ý nhất — Phần C, các lỗi ẩn tìm ra ở vòng audit thứ 2):**
- **C2** — không có hàm escape HTML nào tồn tại trong toàn bộ app (nguy cơ XSS qua tên bài tập/ghi chú do user tự nhập).
- **C3** — rest timer không dừng khi chuyển tab.
- **C4** — `renderGoalGrid()` chỉ lấy dòng mới nhất theo *toàn bộ record*, không phải mới nhất *theo từng metric riêng* (dữ liệu goal có thể hiển thị sai/cũ nếu các metric được nhập ở các thời điểm khác nhau).
- **C5** — chức năng Restore-from-file commit dữ liệu vào `state` **trước khi** validate/normalize xong.
- **C7** — Excel export tính PR (personal record) theo *tên hiển thị* bài tập thay vì theo ID — rủi ro gộp nhầm PR giữa các bài trùng tên/đã đổi tên.
- **C8** — phụ thuộc `Promise.prototype.finally`, chỉ có từ Safari 11.1+.

**🟢/🔵 Low/Cosmetic:** ~25+ mục nhỏ (thiếu `|| null` nhất quán, tiêu đề sai version A8_v4 thay vì A9_v4, code trùng lặp giữa 3 hàm render combo tương tự nhau, v.v.)

**6 nghi vấn bị loại trừ sau khi xác minh kỹ (không phải lỗi thật):** nghi ngờ lỗi nhân 1000× khi tính calorie (không đúng), chia-cho-0 trong `renderBodyChart` (an toàn), vòng lặp retry vô hạn trong `gsheetApiFetch` (an toàn, có cờ `isRetry`), lỗi closure biến `var` trong vòng lặp kiểu ES5 (an toàn, dùng `.forEach`), lỗi lệch múi giờ UTC khi tính ngày (an toàn, offset triệt tiêu lẫn nhau), `Math.max.apply` trên mảng rỗng (an toàn, mọi nơi gọi đều đã được guard).

## 3. Những gì đã sửa

**Batch 1 — An toàn khi crash / toàn vẹn dữ liệu (7 fix, tất cả PASS):**
- Fix 1.1: lọc null tận gốc trong `normalizeSetModel`/`normalizeExerciseModel`/`normalizeWorkoutModel`/`normalizeDataModelV3`, ở cả 3 tầng lồng nhau (set/bài tập/lịch sử).
- Fix 1.2: bọc toàn bộ boot sequence trong try/catch/finally, ẩn splash chuyển vào khối `finally` (đảm bảo LUÔN ẩn splash dù có lỗi), thêm banner lỗi mới `#bootErrorBanner`.
- Fix 1.3: `runIntegrityCheck()` giờ chạy cả lúc boot.
- Fix 1.4: khối catch của `loadState()` sao lưu dữ liệu thô bị hỏng vào key có timestamp riêng + hiện banner lỗi mới `#loadErrorBanner`.
- Fix 1.5: thêm `FileReader.onerror`/`onabort` cho chức năng Restore từ file.
- Fix 1.6: `thumbHTML()` guard giá trị `id` falsy/không phải string, trả về fallback trực tiếp.
- Fix 1.7: Restore-from-file gọi `normalizeDataModelV3()` trên dữ liệu parse được **trước khi** gán vào `state` (đóng lỗ hổng C5 — validate trước khi commit).

**Batch 2 — Đúng đắn hiển thị / runtime (3 fix chính thức + 2 phát hiện thêm khi test, tất cả PASS):**
- Fix 2.1: hàm `escapeHtml()` mới, áp dụng tại ~10 điểm (7 điểm dự kiến ban đầu + 1 điểm bonus `resolvedEquipmentDisplay()` + 2 điểm phát hiện thêm ngay trong lúc test hồi quy: `sess.buoi` và text option trong `populateSubgroupFilter()`) — đóng lỗ hổng XSS C2.
- Fix 2.2: thêm guard dọn dẹp thứ 4 vào `switchScreen()` để gọi `stopRestTimer()` khi rời tab Ghi log — đóng lỗ hổng C3.
- Fix 2.3: hàm mới `latestNonNullMetric(arr, field)`, viết lại `renderGoalGrid()` để lấy giá trị mới nhất **theo từng metric riêng** thay vì theo 1 dòng mới nhất chung — đóng lỗ hổng C4.

**Batch 3 — Hiệu năng / khởi động (4 fix, tất cả PASS, batch đầu tiên đụng tới SW):**
- Fix 3.1: external hoá 7/8 ảnh mascot base64 ra file PNG riêng (`pics/resized/sogym_mascot_02..08.png`), giữ lại `mascot_01` nhúng inline làm ảnh mặc định (đảm bảo splash luôn có ảnh ngay frame đầu tiên).
- Fix 3.2: tự host `xlsx.full.min.js` v0.20.3 cục bộ, bỏ `<script>` CDN chặn đồng bộ trong `<head>`, thêm `loadSheetJs()` tải lazy — chỉ tải khi `exportXlsx()` thực sự được gọi và `typeof XLSX==='undefined'`.
- Fix 3.3: bỏ lệnh gọi `renderHistory()` vô điều kiện khỏi boot sequence, chỉ giữ trong `checkAndArchiveStaleSession()` và `switchScreen('history')`.
- Fix 3.4: `SW_A_Final_WIP.js` mới thay `SW_A7_v2.js` — tổng quát hoá LRU thành helper `trimCache()`/`touchCacheEntry()` dùng chung cho cả 3 bucket cache; `sogym-cache-v4` (tăng từ v3) giới hạn 30 entry + touch-on-hit; bucket mới `sogym-splash-v1` riêng cho ảnh splash, tối đa 10 entry; `sogym-images-v1` giữ hành vi cũ, 400 entry.

**Batch 4 — Tương thích Safari di động (4 fix, tất cả PASS, kèm caveat "chưa test iPhone thật"):**
- Fix 4.1: thêm `viewport-fit=cover` vào viewport meta, kích hoạt các CSS `env(safe-area-inset-*)` vốn đã có sẵn nhưng bị vô hiệu.
- Fix 4.2: tăng `font-size` từ 14–15px lên 16px trên 4 class input, ngăn Safari tự động zoom khi focus input.
- Fix 4.3: CSS rule mới `.app-modal-overlay.prompt-open` căn top cho modal loại prompt duy nhất, tránh bị bàn phím iOS che khuất.
- Fix 4.4: thay `.finally()` bằng dạng `.then(cb, cb)` 2 tham số cho `gsheetBackup`/`gsheetRestore`, bỏ phụ thuộc Safari 11.1+ (đóng lỗ hổng C8).

**Batch 5 — Dọn dẹp (3 fix, tất cả PASS):**
- Fix 5.1: sửa title sai version A8_v4 → A9_v4, bỏ đoạn changelog cũ không hợp lý trong `<title>`.
- Fix 5.2: 2 điểm viết tay `dd/mm/yyyy` được thay bằng helper dùng chung `vnDate()`.
- Fix 5.3: thêm `|| null` vào 3 điểm gán `sessionDateISO` cho nhất quán.

**Ad-hoc "Batch 6" (2026-08-24, ngoài phạm vi 24 nhóm audit gốc, theo yêu cầu riêng của user sau khi Bước 7 đã PASS — xem mục Phụ lục ở cuối báo cáo).**

## 4. Những gì đã xóa

- Script `<script>` CDN SheetJS chặn đồng bộ trong `<head>` (thay bằng tải lazy nội bộ).
- Lệnh gọi `renderHistory()` không điều kiện khỏi boot sequence.
- 7/8 blob base64 ảnh mascot khỏi HTML nhúng inline (chuyển ra file PNG riêng trên đĩa).
- Đoạn changelog cũ, không còn hợp lý, từng nằm trong ngoặc của `<title>`.
- File tạm phát sinh trong quá trình audit (`_bgremove_preview/`, file scratch base64) — dọn sau khi hoàn tất Batch 6 ad-hoc.

**Không xoá bất kỳ dữ liệu người dùng, không xoá bất kỳ tính năng nào** — checksum Exercise Database (873 bài) xác nhận tuyệt đối khớp BEFORE/AFTER (xem mục 9).

## 5. Những gì đã tối ưu

- **Kích thước file:** HTML chính giảm 58.1% (4,773,403 → 2,000,224 bytes ở bản WIP; deliverable cuối `SoGym_A_Final_Optimized_v1.html` = 2,073,032 bytes do có thêm ~150 bytes comment/tên file mới, không đáng kể).
- **Thời gian khởi động:** `DOMContentLoaded` giảm 87.1% (473ms → 61ms); ước tính thời gian parse+exec script đồng bộ giảm 97.8% (358ms → 8ms).
- **Chi phí render History:** chuyển từ "trả phí ~20ms ở MỌI lần mở app" (kể cả khi không xem tab đó) sang "trả phí ~20ms đúng 1 lần, chỉ khi user thực sự mở tab Lịch sử".
- **SW cache:** tổng quát hoá logic LRU (trước đây chỉ áp cho 1 bucket) thành helper dùng chung cho cả 3 bucket, đóng lỗ hổng tăng trưởng không giới hạn của cache HTML chính; thêm bucket riêng cho ảnh splash.
- **Export Excel:** chuyển từ phụ thuộc CDN mạng ngoài mỗi lần dùng, sang tự host + cache SW → hoạt động offline từ lần dùng thứ 2 trở đi (đúng tinh thần offline-first của app).

## 6. Những gì KHÔNG sửa và lý do

- **C7 (PR trong Excel export khoá theo tên thay vì ID):** cố ý **không sửa logic**, chỉ thêm comment giải thích chi tiết. Lý do: điều tra cho thấy chuyển sang khoá theo ID có rủi ro tạo ra lỗi MỚI — các buổi tập cũ (legacy) có `exerciseId` ngẫu nhiên theo từng entry, chuyển sang keying theo ID có thể làm TÁCH sai các PR thật sự trùng nhau. Quyết định qua `AskUserQuestion`, chọn phương án rủi ro thấp hơn.
- **N3-b (gộp 3 hàm render combo gần giống nhau):** bỏ qua hoàn toàn theo quyết định user — bản thân audit gốc cũng đánh giá đây là "không bắt buộc" (not mandatory), thuần rủi ro regression mà không có lợi ích hiển thị cho người dùng.
- **N13 (thiếu debounce khi gõ tìm kiếm trên 873 bài):** cố ý ngoài phạm vi — đã đo thực tế 8.6ms/lần gọi `renderPicker()`, đủ mượt trên Chromium, audit gốc ghi nhận "873 bài chưa phải dataset cực lớn... giải pháp đơn giản và ổn định được ưu tiên".
- **manifest.json / khoá xoay màn hình ở tầng OS thật:** cố ý không thêm — giữ đúng quyết định phạm vi "chỉ nhắm iPhone/Safari, không cần PWA-installable qua manifest" đã chốt từ trước; khoá xoay (Batch 6 ad-hoc) dùng giải pháp CSS-overlay thay thế, xem Phụ lục.
- **Các mục C9 nhỏ khác** (`SoGymDataStore.read` mutate-on-read, khả năng trùng lý thuyết của `makeStableId`, race điều kiện hẹp khi multi-tab): ghi nhận vào audit nhưng không sửa trong đợt này — mức độ rủi ro thấp/lý thuyết, không có bằng chứng xảy ra thực tế, để dành đánh giá lại ở Giai đoạn B nếu cần.

## 7. Test đã chạy

- **Regression test theo từng batch** (5 lần, sau mỗi batch fix): test lại toàn bộ tính năng liên quan trực tiếp tới các fix trong batch đó trước khi sang batch tiếp theo, đúng kỷ luật tuần tự của dự án.
- **Bước 6 — BEFORE/AFTER comparison có định lượng:** seed đúng 1 bộ dữ liệu giống hệt nhau (80 buổi tập, 60 dòng cơ thể, 60 dòng dinh dưỡng, ~126.8KB) trên cả 2 bản qua cùng origin `localStorage`, đo qua Navigation Timing API + `performance.now()` + `performance.memory` (không phải ước tính lý thuyết).
- **Bước 7 — Full functional regression:** phủ toàn bộ checklist Section IV của prompt gốc + các tính năng liền kề (cardio, rest timer, modal xoá set, banner buổi tập cũ (stale-session), randomizer mascot, Wake Lock). Chủ động tiêm lại payload kiểu XSS (loại cardio, ghi chú cơ thể, tên bài tập restore) để xác nhận `escapeHtml()` (Fix 2.1) vẫn chặn đúng. Kiểm tra trực tiếp Cache Storage (3 bucket, tổng 158 entry) làm bằng chứng khả năng hoạt động offline.
- **Ad-hoc Batch 6 verification** (mascot sizing/transparency/rotate-lock): verify qua `preview_eval` — computed CSS size, `naturalWidth/Height`, lấy pixel thật từ canvas để xác nhận alpha channel qua đúng pipeline decode PNG của trình duyệt (không chỉ verify offline bằng PIL); verify overlay xoay ngang bằng cách resize viewport thật 2 chiều.
- **Smoke test cuối cùng trên deliverable** (`SoGym_A_Final_Optimized_v1.html`): xác nhận title hiển thị đúng, Service Worker đăng ký đúng vào đúng file `SoGym_A_Final_Optimized_SW_v1.js` (kiểm tra `reg.active.scriptURL`), verify byte-exact CRLF/UTF-8-no-BOM sau mọi chỉnh sửa.

## 8. Kết quả test

- **Tất cả regression test theo batch: PASS** (Batch 1–5, không phát sinh lỗi mới nào trong quá trình test).
- **Bước 6:** số liệu định lượng đầy đủ ở mục 9 dưới đây — mọi tính năng verify lại đều cho kết quả đúng (History 80/80 buổi khi mở tab, Search không đổi hiệu năng, Export/SW cache hoạt động đúng sau khi đổi).
- **Bước 7:** **PASS toàn bộ**, không phát hiện regression nào. Ghi chú: trong lúc test tự phát hiện thêm 2 điểm escaping còn sót (đã vá ngay trong Batch 2, không phải lỗi mới phát sinh từ chính Batch 2). Tự phát hiện và tự sửa 1 lỗi ghi chép sai (checksum `819009439` → đúng phải là `815734522`), đính chính minh bạch ngay trong tài liệu, không che giấu.
- **Ad-hoc Batch 6:** PASS trên Chromium desktop — mascot resize đúng công thức `min(66vw,66vh,340px)`, nền trong suốt xác nhận qua canvas pixel thật (không chỉ PIL offline), overlay xoay ngang bật/tắt đúng 2 chiều. **Chưa test trên iPhone/Safari thật** (xem mục 10).
- **Smoke test deliverable cuối:** PASS — `document.title` = "Sổ Gym — Final Optimized v1", `reg.active.scriptURL` trỏ đúng `SoGym_A_Final_Optimized_SW_v1.js`, không có console error thật (chỉ có log `GSI_LOGGER` popup-blocked của Google OAuth — môi trường automation không mở được popup, không liên quan tới thay đổi nào của audit), file giữ nguyên 0 byte BOM + toàn bộ 3,492 dòng CRLF.
- **Database integrity:** checksum djb2 của 873 bài Exercise Database = `815734522`, khớp tuyệt đối cả BEFORE lẫn AFTER — xác nhận không có dòng nào bị mất/đổi.

## 9. BEFORE vs AFTER

*(Số liệu đầy đủ, đo thực qua DevTools Performance API — xem chi tiết phương pháp tại `QA/SoGym_FinalAudit_Buoc6_BeforeAfter.md`)*

| Chỉ số | BEFORE (`SoGym_A9_v4.html`+`SW_A7_v2.js`) | AFTER (Batch 1-5, đo trên WIP) | Chênh lệch |
|---|---|---|---|
| Kích thước HTML | 4,773,403 bytes (~4.55MB) | 2,000,224 bytes (~1.91MB) | **−58.1%** |
| Kích thước Service Worker | 7,888 bytes | 12,165 bytes | +54.2% (đánh đổi có chủ đích, đổi lấy LRU đúng đắn) |
| `DOMContentLoaded` | 473 ms | 61 ms | **−87.1%** |
| `domComplete` / `load` | ~475–476 ms | ~69 ms | −85.5% |
| Ước tính parse+exec script đồng bộ | 358 ms | 8 ms | **−97.8%** |
| `renderHistory()` lúc boot | Luôn chạy (80/80 buổi + 6 ô thống kê) dù không xem tab đó | Không chạy lúc boot (0ms); chỉ chạy khi mở tab Lịch sử (~20.1ms) | Bỏ chi phí không cần thiết ở mọi lần mở app |
| Search/filter (873 bài, từ khoá "press") | 8.74 ms | 8.60 ms | Không đổi (trong nhiễu đo đạc, N13 cố ý ngoài phạm vi) |
| JS heap ngay sau boot | ~17.4 MB | ~17.1 MB | Nhẹ hơn chút, không phải trọng tâm batch nào |
| Checksum Exercise Database (873 bài) | 815734522 | 815734522 | **Khớp tuyệt đối — không mất dữ liệu** |
| Export Excel | Phụ thuộc CDN mạng ngoài mỗi lần dùng | Tự host + SW cache → offline từ lần 2 | Đúng mục tiêu offline-first |

**Kết luận Bước 6:** nhẹ hơn (−58.1% HTML), nhanh hơn (−87.1% DOMContentLoaded, −97.8% parse+exec), không mất chức năng, không mất dữ liệu, có 2 đánh đổi nhỏ đã biết và có chủ đích (SW +4.3KB, thêm 930KB `xlsx.full.min.js` trên đĩa để đổi lấy khả năng offline).

## 10. Các vấn đề còn tồn tại

- **Chưa test trên iPhone/Safari thật** — toàn bộ audit + fix + đo hiệu năng được thực hiện qua Chromium (Claude Preview MCP). Các cải thiện mang tính cấu trúc (ít byte hơn để parse, ít công việc đồng bộ hơn lúc boot) nên hướng cải thiện gần như chắc chắn giữ nguyên trên Safari thật, nhưng con số tuyệt đối có thể khác, đặc biệt trên iPhone đời cũ (CPU yếu hơn). Áp dụng cho: Batch 4 (toàn bộ, vốn dành riêng cho tương thích Safari di động), và Batch 6 ad-hoc (mascot sizing/transparency, overlay xoay ngang).
- **C7 (PR Excel export khoá theo tên)** vẫn còn tồn tại theo quyết định có chủ đích (mục 6) — rủi ro thấp, chỉ ảnh hưởng trường hợp hiếm (nhiều bài tập trùng tên hiển thị).
- **N13 (thiếu debounce tìm kiếm)** vẫn tồn tại theo quyết định có chủ đích — không cấp thiết ở quy mô dữ liệu hiện tại (873 bài).
- **Các mục C9 nhỏ** (mutate-on-read trong `SoGymDataStore.read`, khả năng trùng lý thuyết của `makeStableId`, race hẹp khi multi-tab) — mức rủi ro thấp/lý thuyết, chưa có bằng chứng xảy ra thực tế, chưa xử lý trong đợt này.
- **`performance.memory` là API riêng của Chromium** — không có cách đối chiếu trực tiếp tương đương trên Safari, nên số liệu heap ở mục 9 chỉ mang tính tham khảo cho môi trường Chromium.

## 11. Các khuyến nghị cho Giai đoạn B

- **Ưu tiên hàng đầu: chạy một vòng test thật trên iPhone/Safari** trước khi bắt đầu Giai đoạn B — đặc biệt xác nhận lại Batch 4 (safe-area/notch, auto-zoom input, modal vs bàn phím ảo, `Promise.finally` polyfill) và Batch 6 ad-hoc (kích thước mascot thực tế, độ mượt overlay xoay ngang) trên thiết bị thật, vì toàn bộ các fix này được thiết kế RIÊNG cho môi trường đó nhưng chỉ mới verify qua giả lập Chromium.
- **Tận dụng nền tảng đã chuẩn bị sẵn** (ghi nhận từ Nhóm 24 của Bước 1 audit): schema state đã có sẵn cấu trúc cho cơ thể (`body`)/dinh dưỡng (`nutrition`)/mục tiêu (`goals`), có versioning cho migration (`normalizeDataModelV3`) — Giai đoạn B có thể mở rộng trực tiếp trên nền này mà không cần thiết kế lại từ đầu.
- **Cân nhắc rủi ro dài hạn của việc lưu toàn bộ dữ liệu trong 1 blob JSON `localStorage` duy nhất** (`sogym_data_v1`) — hiện tại phù hợp với quy mô dữ liệu (đo thực tế ~126.8KB cho 80 buổi tập), nhưng nếu Giai đoạn B mở rộng thêm nhiều loại dữ liệu mới hoặc user dùng app nhiều năm liên tục, nên đánh giá lại giới hạn dung lượng `localStorage` (thường ~5-10MB tuỳ trình duyệt) và cân nhắc chia nhỏ theo namespace nếu cần.
- **Xử lý C7 dứt điểm** nếu Giai đoạn B đụng tới luồng export/PR — nên thiết kế lại việc gán `exerciseId` ổn định cho TẤT CẢ buổi tập (kể cả dữ liệu legacy) như một phần của một migration version mới, thay vì vá cục bộ như đã cân nhắc và từ chối trong đợt audit này.
- **Thêm debounce cho search (N13) nếu Exercise Database mở rộng đáng kể** vượt quá quy mô hiện tại (873 bài) trong Giai đoạn B.
- **Cân nhắc quy trình audit định kỳ tương tự** (7 bước: audit → propose → fix → regression → performance → before/after → full retest) cho các cột mốc lớn tiếp theo, vì quy trình này đã chứng minh hiệu quả phát hiện lỗi ẩn thật sự (7/9 mục ở vòng audit thứ 2 — Phần C — là lỗi thật, không phải suy đoán).

---

## Phụ lục: Ad-hoc "Batch 6" (ngoài phạm vi 24 nhóm audit gốc)

Sau khi Bước 7 đã PASS toàn bộ, user yêu cầu thêm (ngày 2026-08-24, cùng ngày) 2 vấn đề hình ảnh mascot + 1 tính năng mới, được xử lý với cùng kỷ luật hỏi-rõ-trước-khi-sửa của dự án (4 câu hỏi qua `AskUserQuestion`, xác nhận đủ trước khi đụng code):

1. **Kích thước mascot theo nguyên tắc "1/3-2/3 negative space":** CSS `#splashScreen img` đổi từ `120px` cố định sang `width/height:min(66vw,66vh,340px)` — mascot chiếm ~66% chiều ngắn hơn của viewport, có trần an toàn 340px cho màn hình lớn (iPad).
2. **Tách nền đen của ảnh mascot (8 file):** viết script Python/PIL riêng (`QA/SoGym_FinalAudit_MascotBgRemove_script.py`, lưu làm audit trail), dùng thuật toán flood-fill BFS từ 4 mép ảnh vào trong, ngưỡng khoảng cách màu Euclid ≤30 so với pixel mẫu tại góc — kết quả 65.6%–78.3% pixel mỗi ảnh chuyển trong suốt, verify bằng composite lên đúng màu nền splash thật (#121214) và bằng lấy pixel thật qua canvas trong trình duyệt thật (không chỉ PIL offline).
3. **Ngăn xoay ngang màn hình:** overlay CSS-only `#rotateLockOverlay` (`@media(orientation:landscape)`, `z-index:99999`), không dùng `manifest.json` hay API khoá xoay thật của OS — giữ đúng quyết định phạm vi "chỉ nhắm iPhone/Safari" đã chốt trước đó trong dự án.

Toàn bộ 3 điểm đã fold vào `SoGym_A_Final_WIP.html` trước khi tạo deliverable cuối cùng, theo đúng lựa chọn của user tại câu hỏi thứ 4. Đã verify qua Claude Preview MCP (`preview_eval`, do `preview_screenshot` bị flaky/timeout — vấn đề tooling đã biết từ trước, không phải lỗi app). **Caveat:** chưa test trên iPhone/Safari thật (xem mục 10).

---

## Danh sách file liên quan

| File | Vai trò |
|---|---|
| `SoGym_A9_v4.html` + `SW_A7_v2.js` | Baseline gốc, giữ nguyên không đổi (mốc so sánh BEFORE) |
| `SoGym_A_Final_WIP.html` + `SW_A_Final_WIP.js` | File làm việc trung gian qua cả 6 batch, giữ lại làm audit trail |
| `SoGym_A_Final_Optimized_v1.html` + `SoGym_A_Final_Optimized_SW_v1.js` | **Deliverable chính thức cuối cùng** |
| `SoGym_Final_Optimization_Report.md` | Báo cáo này |
| `QA/SoGym_FinalAudit_Buoc1_Report.md` | Chi tiết đầy đủ Bước 1 (audit gốc, 24 nhóm + Phần C) |
| `QA/SoGym_FinalAudit_HandoffNote.md` | Kế hoạch 5 batch + đề xuất fix chi tiết |
| `QA/SoGym_FinalAudit_Buoc6_BeforeAfter.md` | Số liệu đo BEFORE/AFTER đầy đủ |
| `QA/SoGym_FinalAudit_MascotBgRemove_script.py` | Script tách nền mascot (Batch 6 ad-hoc) |
