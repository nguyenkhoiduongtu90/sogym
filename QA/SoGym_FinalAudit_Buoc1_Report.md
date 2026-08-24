# Final Audit — Bước 1: Báo cáo Audit toàn diện (AUDIT ONLY, KHÔNG sửa file)

**File audit:** `SoGym_A9_v4.html` (bản hiện có trên đĩa, 3274 dòng, 4,773,403 bytes) + `SW_A7_v2.js` (không sửa).
**Ngày:** 2026-08-22. **Phạm vi:** 24 nhóm theo `sogym_final_audit_prompt.md`.
**Phương pháp:** kết hợp (a) audit tĩnh qua Grep/Read (4 agent song song, mỗi agent phụ trách 1 cụm nhóm) và (b) kiểm chứng runtime thật qua Claude Preview MCP (Chromium) — KHÔNG có iPhone thật, nên mọi finding đặc thù Safari/iOS được gắn nhãn "chưa test trên iPhone thật" ngay tại chỗ.
**Quy tắc:** Không có thay đổi nào được thực hiện lên `SoGym_A9_v4.html` hay `SW_A7_v2.js` trong quá trình audit này. Đây chỉ là danh sách phát hiện, dừng lại chờ xác nhận trước khi sang Bước 2.

---

## TÓM TẮT ĐIỀU HÀNH (Executive Summary)

| Mức độ | Số lượng | Ghi chú |
|---|---|---|
| 🔴 Critical | 2 | (1) Boot sequence có thể treo splash vĩnh viễn nếu `history` chứa phần tử hỏng; (2) 3.03MB (66.5% file) là ảnh mascot base64 parse đồng bộ, chặn toàn bộ JS logic + catalog phía sau |
| 🟠 High | 6 | Xem chi tiết Nhóm 20–22; bao gồm `loadState()` thất bại âm thầm, thiếu `viewport-fit=cover`, script SheetJS chặn render trong `<head>`, `renderHistory()` không giới hạn quy mô, thumbnail ảnh `undefined` bị cache vĩnh viễn |
| 🟡 Medium | ~13 | Trải khắp các nhóm — chi tiết bên dưới |
| 🟢 Low/Clean | ~25+ | Nhiều điểm đã kiểm tra và xác nhận KHÔNG có vấn đề — liệt kê để tránh audit thừa ở vòng sau |
| 🔵 Cosmetic | ~7 | Không ảnh hưởng chức năng |

**2 phát hiện Critical cần ưu tiên xem xét trước** (chi tiết đầy đủ ở Nhóm 20 và Nhóm 17/18):
1. Nếu `state.history` (localStorage) có 1 phần tử `null`/hỏng cấu trúc vì bất kỳ lý do gì, `renderHistory()`/`renderHome()` sẽ throw ngay trong chuỗi khởi tạo top-level (dòng 3211-3216) — vì khối này KHÔNG có try/catch và `runIntegrityCheck()` (cơ chế tự chữa lành đã có sẵn) chỉ được gọi sau Restore/khi mở tab Lịch sử, KHÔNG được gọi lúc boot bình thường. Hệ quả: app treo vĩnh viễn ở màn splash, giống hệt 1 bug đã từng xảy ra và được vá (nhưng chỉ vá đường Restore, chưa vá đường boot).
2. Khối `<script>` dòng 318–341 (8 ảnh mascot splash base64) nặng 3,172,339 byte = 66.5% tổng dung lượng file, không `async`/`defer`, nằm TRƯỚC cả JS logic chính và catalog 873 bài trong document order → engine phải parse xong toàn bộ trước khi tới lượt định nghĩa hàm và catalog. Chỉ 1/8 ảnh được dùng mỗi lần tải (87.5% lãng phí băng thông/CPU).

---

## PHẦN A — KẾT QUẢ AUDIT TĨNH (4 agent song song)

### NHÓM 1 — Cấu trúc code

🟡 **Medium** — Một số hàm quá lớn, gộp nhiều trách nhiệm (tính toán + render HTML + gắn listener trong cùng hàm): `buildExportSheets()` (2390–2562, 172 dòng), `renderBodyHistoryList()` (2188–2344, 156 dòng), `renderHistory()` (1854–2005, 151 dòng), `renderPicker()` (1391–1488, 97 dòng), `migrateData()` (803–896, 93 dòng), `renderSetRows()` (1657–1745, 88 dòng). Không gây lỗi runtime, chỉ tăng rủi ro khi sửa sau này. Refactor tuỳ chọn, không bắt buộc, không đụng kiến trúc single-file.

🟢 Clean — 3 khối `<script>` tách riêng (chính/catalog/init) là fix có chủ đích cho bug thứ tự load cũ (đã tài liệu hoá trong comment), không phải vấn đề cấu trúc.

🟢 Clean — Không có tên hàm trùng lặp (~90 hàm, grep xác nhận duy nhất).

### NHÓM 2 — Dead code

🟢 Clean — Không tìm thấy dead code nào có đủ bằng chứng. Đã xác minh dứt điểm 2 nghi vấn (`.exercise-item.done`, `.nav-icon-emoji`) đều đang được dùng hoặc giữ lại có chủ đích (tài liệu hoá rõ trong comment). Không có code comment-out, không có TODO/FIXME/HACK thật (chỉ có false-positive từ ký tự base64).

### NHÓM 3 — Duplicate code

🟡 **Medium** — Logic format `dd/mm/yyyy` bị viết lại tay ở 2 nơi (dòng 1367–1368, 1881–1882) thay vì gọi hàm dùng chung `vnDate()` (dòng 2351) đã có sẵn. Rủi ro thấp, sửa đơn giản (thay bằng gọi `vnDate(iso)`).

🟡 **Medium** — 3 hàm render combo/autocomplete gần giống hệt nhau: `renderCardioTypeCombo()` (1267–1284), `renderCombo()` (1550–1574), `renderCustomSubCombo()` (1616–1646). Có thể gộp thành 1 helper dùng chung nhưng không bắt buộc (mỗi hàm có side-effect riêng).

🟢 Clean — Không phát hiện thêm cặp duplicate đáng kể nào khác.

### NHÓM 4 — JavaScript

🟢 Clean — 100% ES5 thuần (0 kết quả cho `let`/`const`/arrow function/template literal) — đúng chủ đích tương thích Safari cũ.
🟢 Clean — Không có `console.log` debug sót lại; chỉ 4 `console.warn` hợp lệ trong `catch` block.
🟢 Clean — Feature-detection/error-handling quanh Service Worker, Wake Lock, `navigator.storage.persist()` đều đúng chuẩn.
🟢 Clean — `renderPicker()` có guard chặn render 873 item khi chưa lọc — hoạt động đúng.

🟡 **Low/Medium** — Hầu hết hàm `render*` rebuild `innerHTML` + rebind listener mới mỗi lần gọi thay vì event delegation (71 lời gọi `addEventListener`). Không phải vấn đề hiệu năng thực sự ở quy mô dữ liệu hiện tại của app cá nhân — ghi nhận, không khuyến nghị refactor toàn diện.

### NHÓM 5 — CSS

🟢 Clean — Không có `!important` nào trong toàn file.
🔵 Cosmetic — 3 cơ chế nhúng base64 song song (CSS `background-image:url()`, `<img src="data:...">` tĩnh, biến JS inject runtime) — không phải lỗi, chỉ thiếu quy ước thống nhất; không đề xuất đổi vì đụng chiến lược asset đã chốt.
🔵 Cosmetic — ~25 `style="..."` inline dài (>40 ký tự); 4 chỗ tĩnh lặp `grid-template-columns:1fr 1fr` có thể gộp `.grid-2col` nếu muốn — lợi ích rất nhỏ.
🟢 Clean — Không phát hiện CSS selector định nghĩa trùng lặp.

### NHÓM 6 — HTML

🟢 Clean — Không có `id` trùng lặp (~105 lần khai báo `id=`, rà soát không thấy trùng).
🟢 Clean — 5 nav-item dùng chung 1 pattern nhất quán, đều có `alt` text hợp lý.
🟢 Clean — Cấu trúc body mạch lạc theo từng screen, banner/modal dùng chung đặt hợp lý.
🔵 Cosmetic — Dùng `onclick="..."` inline cho một số nút tĩnh thay vì `addEventListener` — hợp lệ về kỹ thuật, không đề xuất đổi toàn diện.

---

### NHÓM 7 — Data loading (`SOGYM_EXERCISE_CATALOG`)

🟢 Clean — Catalog là array literal JS thuần (không `JSON.parse` chuỗi), parse đồng bộ nhưng object phẳng không lồng sâu.
🟢 Clean (điểm mạnh) — Dev đã tự phát hiện + sửa 1 bug thật (comment "A4.5_v5"): bản trước gọi `renderHome()` TRƯỚC khi catalog load xong → `Cannot read properties of undefined`, treo splash. Bản hiện tại đã dời toàn bộ khối init xuống sau catalog — thứ tự đúng, hết rủi ro race-condition này.

### NHÓM 8 — Exercise Database (873 bài)

🟢 Clean — Đếm thực tế: đúng **873 bản ghi**, **0 ID trùng lặp** (`sort -u` cũng ra 873).
🟢 Clean — Đủ 100% cả 7 field bắt buộc (`id`, `nameEn`, `nameViAuto`, `sub`, `equipGroup`, `equipDetail`, `force`) ở TẤT CẢ 873 bản ghi, không có giá trị rỗng `""`.
🟢 Clean — Không có mutation trực tiếp lên catalog gốc — mọi tuỳ biến người dùng đi qua `state.customOverrides[id][field]`, không ghi đè object catalog gốc.
🟢 Low — ~199/873 (≈22.8%) bản ghi có `equipDetail = "Chưa xác định"` — placeholder hiển thị nguyên văn cho người dùng, không phải bug chức năng, chỉ là độ hoàn thiện nội dung.

### NHÓM 9 — Image loading

🟢 Clean — Icon UI (nav, favicon, fallback thumb...) nhúng base64; ảnh minh hoạ 873 bài tập tải qua mạng (`raw.githubusercontent.com/yuhonas/free-exercise-db`), có `loading="lazy"` + `onerror` fallback về ảnh base64 khi lỗi/mất mạng.

🟠 **High** (phát hiện qua kiểm chứng runtime, không thấy được nếu chỉ đọc code) — **`thumbHTML()` được gọi với 2 cách truy cập property không nhất quán**: dòng 1206 và 1652 dùng `thumbHTML(ex.catalogId)`, còn dòng 1445 dùng `thumbHTML(ex.id)`. Bằng chứng runtime: kiểm tra Cache Storage (`sogym-images-v1`) qua Preview MCP phát hiện có entry ảnh với URL kết thúc bằng `.../undefined/0.jpg` — tức tại 1 trong các call site này, object `ex` không có property được truy cập (`catalogId` hoặc `id` là `undefined`), sinh ra request ảnh hỏng bị cache vĩnh viễn dưới dạng opaque response (SW không phân biệt được 404 thật với thành công vì response cross-origin no-cors luôn báo status 0). **Cần xác nhận chính xác call site nào sai** (tuỳ theo object tại dòng 1445 — context picker — có field gì) trước khi sửa ở Bước 3; đây là audit finding, chưa xác định fix cụ thể.

### NHÓM 10 — localStorage

🟢 Clean — Chỉ 2 key: `sogym_data_v1` (toàn bộ state) và `sogym_google_sheet_id` (con trỏ Sheet, cố ý tách khỏi backup payload).
🟢 Clean — Có migration theo `DATA_SCHEMA_VERSION` (hiện = 3), xử lý tuần tự 1→2→3, không đụng dữ liệu cũ khi nâng schema.
🟢 Clean — Không có `localStorage.clear()` bừa bãi; `resetAllData()` được bảo vệ 2 lớp xác nhận (`confirm()` + gõ đúng "XÓA").
🟢 Clean — Có xử lý lỗi khi ghi thất bại (banner cảnh báo rõ ràng).
🟢 Clean — Đồng bộ đa tab qua sự kiện `storage`, xử lý đúng case tab khác xoá dữ liệu.

### NHÓM 11 — Service Worker (`SW_A7_v2.js`)

🟢 Clean — Chiến lược fetch phân nhánh hợp lý: navigation network-first + fallback cache; ảnh bài tập cache-first + LRU tối đa 400; cross-origin khác (Google Sheets API...) luôn ra mạng, không bao giờ cache (fix có chủ đích cho vụ từng cache nhầm response API).
🟡 **Medium** — SheetJS CDN (`cdn.sheetjs.com`) rơi vào nhánh cross-origin bypass → **không được SW chủ động cache**, chỉ phụ thuộc HTTP cache mặc định của trình duyệt. Có graceful fallback (`typeof XLSX==='undefined'` → alert tiếng Việt), không crash, nhưng tính năng Xuất Excel thực sự không hoạt động offline nếu thư viện chưa từng cache thành công.

🟠 **High** (phát hiện qua runtime, kiểm tra Cache Storage thật) — **`sogym-cache-v3` tăng trưởng không giới hạn, giữ lại HTML của các phiên bản cũ** (quan sát thấy các bản HTML cũ từ tận A7_v6 vẫn còn trong cache). Nguyên nhân: chiến lược network-first cho navigation vẫn ghi entry mới vào cache mỗi lần deploy bản mới, nhưng không có cơ chế dọn các URL HTML cũ không còn dùng (khác với `IMAGE_CACHE_MAX_ENTRIES=400` đã có cho ảnh). Về lâu dài, cache storage sẽ phình to vô hạn theo số lần đổi tên file HTML qua các version. **Chưa test trên iPhone thật** mức độ ảnh hưởng thực tế (giới hạn quota Cache Storage của Safari/iOS).

### NHÓM 12 — Offline capability

🟢 Clean — Core app (nhập/xem lịch sử, chỉ số cơ thể, xem bài tập đã cache ảnh) hoạt động offline tốt nhờ localStorage + SW cache-first cho tài nguyên cùng gốc.
🟢 Clean (đã kiểm chứng runtime) — Test giả lập corrupt localStorage: app xử lý graceful (không crash trắng màn hình khi qua đường Restore/tab Lịch sử — nơi `runIntegrityCheck()` được gọi); LƯU Ý: kết quả này **không mâu thuẫn** với 🔴 Critical ở Nhóm 20 — corrupt qua Restore được xử lý tốt, nhưng corrupt sẵn có trong localStorage lúc BOOT bình thường thì chưa (2 đường đi khác nhau).

### NHÓM 13 — Search/Filter (873 bài)

🟡 **Medium** — Không debounce trên ô tìm kiếm picker (dòng 1528) — mỗi phím gõ chạy full-scan linear qua 873 bài + `normalizeVi()` nhiều lần. **Đã đo runtime thật qua Preview MCP: ~40–70ms/keystroke** — nhanh, không gây giật cảm nhận được ở quy mô dữ liệu hiện tại. Không cần debounce ngay bây giờ, ghi nhận để tham khảo nếu catalog tăng lớn hơn nhiều trong tương lai.
🟢 Low — `computeHistoryUsageCounts()` và `allExercises()` tính lại/tạo mảng mới mỗi lần gọi, không cache giữa các lần gõ liên tiếp — chi phí nhỏ ở quy mô hiện tại.
🟢 Clean — Guard chặn render 873 node khi chưa lọc hoạt động đúng, giải quyết đúng rủi ro lớn nhất của dataset 873 item.

### NHÓM 14 — Rendering

🟠 **High** — `renderHistory()` (1854–2005) build DOM lồng 3 cấp (buổi tập → bài tập → set) cho **TOÀN BỘ `state.history`** mỗi lần gọi, kể cả set nằm trong panel `display:none` chưa mở — không có pagination/cap, khác hẳn cách `renderPicker()` đã được bảo vệ cẩn thận cho 873 bài. Chi phí tỉ lệ thuận với tổng số set đã từng ghi trong suốt vòng đời dùng app (không giới hạn — xem Nhóm 16). Liên đới trực tiếp Nhóm 17 (Startup): `checkAndArchiveStaleSession()` có thể tự gọi `renderHistory()` ngay trong chuỗi khởi tạo đồng bộ nếu có phiên tập dở dang từ hôm trước — nghĩa là chi phí này có thể xảy ra ngay lúc mở app, không chỉ khi bấm tab Lịch sử. Hiện tại (lịch sử ít) không đáng lo; cần xác minh runtime với dữ liệu lịch sử lớn (vài trăm–nghìn buổi) để biết ngưỡng gây khó chịu thật sự.
🟢 Clean — Không có forced synchronous layout (0 kết quả `getBoundingClientRect`/`offsetWidth`/`scrollHeight` xen kẽ ghi style). Không dùng `innerHTML` để render 873 bài cùng lúc ở bất kỳ đâu. Ảnh thumbnail dùng `loading="lazy"`.
🟢 Clean (đã kiểm chứng runtime) — Cả 320px và 375px viewport: 5 tab chuyển màn đúng, `document.documentElement.scrollWidth` KHÔNG vượt `window.innerWidth` ở bất kỳ tab nào (0 tràn ngang toàn trang), 0 console error.

### NHÓM 15 — DOM

🟢 Clean — Pattern gắn listener nhất quán: rebuild `innerHTML` → gắn listener mới lên node vừa tạo; node cũ + listener cũ bị GC cùng lúc khi `innerHTML` bị ghi đè — không tích tụ listener trùng lặp qua nhiều lần render.
🟢 Clean — `switchScreen()` chỉ toggle class, không gắn thêm listener mỗi lần gọi dù được gọi rất nhiều lần/phiên.

### NHÓM 16 — Memory usage

🟡 **Medium** — `state.history`/`customExercises`/`body`/`nutrition`/`goals` không có cơ chế giới hạn kích thước tự động (chỉ xoá thủ công từng buổi). Không phải leak cổ điển, mà là tăng trưởng dữ liệu hợp lệ không giới hạn — kéo theo chi phí các thao tác quét toàn bộ history (Nhóm 13, 14) tăng dần theo thời gian sử dụng thực tế (nhiều tháng/năm).
🟡 **Medium** — Mỗi `saveState()` (gọi từ 31 vị trí) ghi lại TOÀN BỘ payload (kể cả full history) vào localStorage, không debounce/diff — chi phí serialize scale theo tổng dữ liệu tích luỹ, không theo phần vừa đổi.
🟢 Clean — Không có leak `setInterval`/`setTimeout` (chỉ 2 interval, đều được `clearInterval` đúng cách trước khi tạo mới). Không có pattern gắn listener lặp lại trên phần tử tĩnh.

### NHÓM 17 — Startup time

🔴 **Critical** — (chi tiết đầy đủ ở phần Tóm tắt điều hành, mục 2) Khối mascot base64 3.03MB (66.5% file) parse đồng bộ, không `async`/`defer`, nằm trước JS logic chính + catalog trong document order → chặn Time-To-Interactive rõ rệt nhất có thể chỉ ra từ đọc code tĩnh.

🔴 **Critical** (mức độ tương đương, khía cạnh khác) — `<head>` dòng 15 tải script SheetJS (`cdn.sheetjs.com`) **đồng bộ, không `async`/`defer`**, đặt trước cả `<style>` → chặn HTML parser cho tới khi tải xong. Mâu thuẫn trực tiếp với thiết kế "offline-first, chỉ dùng localStorage" của app — nếu mạng chậm/mất mạng ở lần mở đầu tiên (SW chưa từng cache), trang có thể chậm đáng kể trước khi kịp hiện splash. Đối chiếu: script Google Identity Services (dòng 2682) được nạp **lazy có chủ đích**, đúng nguyên tắc offline-first — cho thấy sự thiếu nhất quán giữa 2 phần code do cùng 1 dev viết.

🟡 **Medium** — `checkAndArchiveStaleSession()` (gọi trong chuỗi init 3211–3216) có thể tự kích hoạt `renderHistory()` không giới hạn (xem Nhóm 14) ngay trong luồng khởi động đồng bộ nếu có phiên tập dở dang từ hôm trước — nối trực tiếp chi phí "cold start" với chi phí render lịch sử không giới hạn.

**Đã đo runtime thật (Claude Preview MCP, Navigation Timing API):** cold-load thực tế **~1.1 giây**, trong đó ~920ms xảy ra trước khi DOM sẵn sàng tương tác — nhất quán với phát hiện tĩnh (khối parse đồng bộ lớn: mascot base64 + script chính + catalog 873 bài) là nguyên nhân chính. Đây là số đo trên Chromium/desktop qua Preview MCP, KHÔNG phải trên iPhone thật — thiết bị di động cũ/mạng chậm hơn có thể cho thời gian dài hơn đáng kể.

🟢 Clean — Splash có delay tối thiểu 400ms có chủ đích (tránh chớp nháy UI) — là quyết định UX, không phải bug. SW đăng ký deferred đúng cách (`window.load`), không chặn render ban đầu.

### NHÓM 18 — File size

**Breakdown thực đo (grep + wc):**

| Phần | Dòng | ~KB | % tổng |
|---|---|---|---|
| `<head>` | 1–123 | ~99 KB | 2.1% |
| `<style>` CSS | 124–315 | ~155 KB | 3.3% |
| **8 mascot base64** | 318–341 | **~3,098 KB** | **66.5%** |
| Body markup (5 màn hình) | 342–648 | ~617 KB | 13.2% |
| `<script>` JS chính | 649–3200 | ~292 KB | 6.3% |
| Catalog 873 bài | 3201–3205 | ~393 KB | 8.4% |
| `<script>` init cuối | 3206–3272 | ~4 KB | 0.1% |
| **TỔNG** | 1–3274 | **~4,662 KB (4.66 MB)** | 100% |

🔴 Critical — 8 ảnh mascot base64 = 66.5% dung lượng file (xem chi tiết Nhóm 17). Đòn bẩy lớn nhất, rõ ràng nhất để giảm file size.
🟡 Medium — ~24 icon nhỏ base64 khác rải rác (đã resize giảm ~89% trước khi nhúng, hợp lý cho icon lặp lại) — không cần ưu tiên.
🔵 Cosmetic — 1 comment changelog khổng lồ ở dòng 16 (hàng nghìn từ) vẫn được tải/parse mỗi lần dù không ảnh hưởng hành vi.
🟢 Clean — Catalog 873 bài (393KB) hợp lý cho 873 object, không dư thừa. Ảnh minh hoạ KHÔNG nhúng base64 (tải on-demand qua URL).

### NHÓM 19 — Network dependency (tổng hợp toàn bộ điểm phụ thuộc mạng ngoài)

| Điểm phụ thuộc | Khi nào gọi | SW cache? | Rủi ro offline |
|---|---|---|---|
| `cdn.sheetjs.com` (SheetJS) | Mọi lần load trang (blocking, không defer) | Không | 🟡 Medium — Xuất Excel hỏng nếu offline, có graceful fallback |
| `fonts.googleapis.com`/`gstatic.com` | Mọi lần load trang | Không | 🟢 Low — fallback font hệ thống |
| `accounts.google.com/gsi/client` | Chỉ khi bấm Google Sheets lần đầu (lazy có chủ đích) | Không | 🟢 Low — có error handling |
| `sheets.googleapis.com` | Khi Sao lưu/Khôi phục Sheets | Không (cố ý, tránh cache nhầm) | 🟢 Low — tính năng phụ, có try/catch |
| `raw.githubusercontent.com/...` (ảnh 873 bài) | Lazy, khi cuộn/mở bài tập | **Có** (LRU 400) | 🟢 Low sau lần xem đầu; xem Nhóm 9 về bug `undefined` |

**Kết luận:** Core app hoạt động offline tốt. Mọi phụ thuộc mạng ngoài đều thuộc tính năng phụ trợ, không điểm nào chặn hoàn toàn việc mở app + ghi nhận buổi tập khi offline.

---

### NHÓM 20 — Error handling

🔴 **Critical** — **Boot sequence không có try/catch bọc `renderHistory()`/`renderHome()`/`checkAndArchiveStaleSession()` → 1 phần tử `null`/hỏng trong `history` làm crash ngay lúc mở app, splash-screen treo vĩnh viễn.**
- Vị trí: dòng 3211–3216 (chuỗi init top-level, không try/catch).
- `renderHistory()` (1856–1861) và `renderHome()` (1166–1171) truy cập trực tiếp `sess.exercises`/`ex.sets`/`sess.dateISO.split('-')` không có null-guard.
- `normalizeWorkoutModel()` không loại bỏ phần tử `null` khỏi mảng `history` (giá trị trả về bị `forEach` bỏ qua).
- `runIntegrityCheck()` (cơ chế tự chữa lành có sẵn, dòng 2986–3035, xử lý đúng case session null) **chỉ được gọi ở 3 nơi: sau Restore JSON, sau Restore Sheets, khi mở tab Lịch sử — KHÔNG được gọi lúc boot bình thường**.
- Chính dev đã từng gặp đúng case này (changelog A6_v2) và vá — nhưng chỉ vá đường Restore, chưa vá đường boot.
- `setTimeout(...400ms...)` ẩn splash nằm SAU chuỗi init trong cùng luồng → nếu throw, splash không bao giờ được ẩn.
- **Tác động:** nếu `history` trong localStorage hỏng vì bất kỳ lý do gì (crash/mất điện iPhone giữa lúc ghi, sửa tay qua DevTools, lỗi tương lai...), app treo vĩnh viễn ở splash mỗi lần mở — class lỗi đã tái diễn với root cause khác.

🟠 **High** — `SoGymDataStore.read()`/`loadState()` khi đọc thất bại (JSON hỏng) trả về `false` và được `catch` đúng cách, NHƯNG lời gọi ở dòng 3211 **không kiểm tra return value** — app âm thầm chạy tiếp với state rỗng như lần mở đầu, **không cảnh báo người dùng** dữ liệu cũ không đọc được (khác hẳn khi GHI thất bại — có banner rõ ràng). Hệ quả nghiêm trọng: hành động ghi tiếp theo của người dùng sẽ ghi đè vĩnh viễn lên đúng key đang chứa dữ liệu cũ, mất cơ hội khôi phục thủ công.

🟡 **Medium** — `FileReader` trong luồng Restore JSON (dòng 2593–2644) chỉ có `onload`, không có `onerror`/`onabort` — nếu đọc file thất bại ở tầng OS/trình duyệt, không có thông báo lỗi, nút Restore trông như "đơ".

🟢 Verified, không có vấn đề — đã kiểm tra kỹ: QuotaExceededError khi ghi (có banner đúng ngữ cảnh); CDN SheetJS không tải được (có graceful alert + try/catch); Import/Export JSON lỗi định dạng (try/catch/finally đầy đủ, có `runIntegrityCheck()` sau restore); Google Sheets API (401 refresh-retry, 404, race condition đa-tab đều xử lý); Service Worker registration (`.catch()` đầy đủ); Wake Lock API (guard + try/catch).

### NHÓM 21 — Data integrity

🟢 Clean — Chỉ 2 localStorage key rõ ràng, có schema versioning (`DATA_SCHEMA_VERSION=3`), `migrateData()` chỉ bổ sung field thiếu, không reset/xoá dữ liệu cũ khi nâng schema.
🟢 Verified — `resetAllData()` bảo vệ 2 lớp; Restore (JSON + Sheets) đều có confirm rõ ràng trước khi ghi đè; đa tab xử lý đúng case tab khác xoá dữ liệu (reload thay vì ghi ngược); `runIntegrityCheck()` chỉ dọn cấu trúc hỏng, không bao giờ đụng số liệu reps/kg thật.
🟠 **High** (cùng gốc với 🔴 Critical Nhóm 20, khía cạnh data-integrity) — `runIntegrityCheck()` có "khoảng trống" trong pipeline khởi tạo: dữ liệu hỏng từ nguồn KHÁC Restore (localStorage hỏng vật lý, luồng ghi mới trong tương lai...) không được dọn trước khi render lần đầu.

### NHÓM 22 — Mobile Safari compatibility

*(TẤT CẢ finding dưới đây: chưa test trên iPhone thật — chỉ suy luận từ đọc code tĩnh, cần real-device test ở vòng sau)*

🟠 **High — chưa test trên iPhone thật** — Viewport meta (dòng 5) **thiếu `viewport-fit=cover`** trong khi CSS đã dùng `env(safe-area-inset-*)` ở nhiều nơi (navbar dòng 288, banner dòng 304–306, dòng 137). Theo spec, `env(safe-area-inset-*)` chỉ trả về khác 0 khi có `viewport-fit=cover` — hiện tại mọi giá trị này đang resolve về `0`. Trên iPhone có notch/Dynamic Island/home-indicator, navbar dưới cùng và banner trên cùng có nguy cơ bị che một phần vì cơ chế né safe-area đã viết nhưng chưa được kích hoạt.

🟡 **Medium — chưa test trên iPhone thật** — Nhiều input (`type="date"`, reps/kg, ghi chú) dùng `font-size:14–15px` — Safari tự động zoom trang khi input được focus nếu font-size tính toán < 16px. Có thể gây zoom không mong muốn mỗi lần chạm ô nhập, đặc biệt khó chịu ở màn Nhập set (nơi dùng nhiều nhất khi tập).

🟡 **Medium — chưa test trên iPhone thật** — Modal `.app-modal-overlay` dùng `position:fixed; inset:0` + flexbox center, không có xử lý `window.visualViewport` khi bàn phím ảo mở (Safari không tự resize visual viewport). Có nguy cơ ô nhập trong modal (`#appModalInput`, dùng cho prompt "XÓA"...) bị đẩy lên gần/khuất sau bàn phím.

🟢 Verified — `touch-action:manipulation` + `overscroll-behavior-y:none` đã áp dụng đúng toàn cục; `-webkit-overflow-scrolling:touch` cho khu vực scroll dài nhất; input số dùng `type="text" inputmode="numeric"/"decimal"` (tránh bug UI của `type="number"` trên Safari); vùng chạm nút đạt chuẩn Apple HIG (≥44px); layout co giãn hợp lý qua `max-width:430px`.

🔵 **Cosmetic — chưa test trên iPhone thật** — Không xử lý `orientation: landscape`/`orientationchange` — không phải lỗi, chỉ là hạn chế đã biết cho app tracker cá nhân dùng chủ yếu ở chế độ dọc.

🔵 Cosmetic — `<title>` (dòng 6) ghi "A8_v4" trong khi filename thật là A9_v4 — không ảnh hưởng chức năng (không dùng cho Add to Home Screen, đã có `apple-mobile-web-app-title` riêng), chỉ gây nhầm lẫn khi xem tab trình duyệt.

### NHÓM 23 — PWA behavior

🟢 Verified — Đầy đủ các thẻ apple-mobile-web-app (`capable`, `status-bar-style`, `title`, `apple-touch-icon`, `theme-color` khớp CSS). Không có `manifest.json` — quyết định có chủ đích (phạm vi chỉ nhắm iPhone/Safari, dùng "Add to Home Screen" native thay vì Chrome/Android install prompt).
🟢 Verified — Service Worker registration đầy đủ guard (protocol check, `window.load`, `.catch()`).
🟡 **Medium (tổng thể) — chưa test trên iPhone thật** — Điều kiện tĩnh cho "Add to Home Screen" đều có mặt, NHƯNG finding thiếu `viewport-fit=cover` (Nhóm 22) ảnh hưởng trực tiếp trải nghiệm SAU KHI đã cài đặt và chạy standalone (dễ lộ vấn đề hơn tab Safari thường vì standalone không có toolbar che bớt phần dưới).

### NHÓM 24 — Future extensibility

🟢 Clean — `state` (869–888) đã chuẩn bị sẵn schema cho `body`/`nutrition`/`goals` (Giai đoạn B), tách bạch tên field rõ ràng, không lẫn với phần Workout hiện tại.
🟢 Clean — `migrateData()` có cơ chế versioning đủ tổng quát để tái sử dụng khi thêm field mới, không cần phát minh lại.
🟡 **Medium (ghi nhận, không đề xuất đổi kiến trúc)** — Toàn bộ `state` đọc/ghi như 1 blob JSON nguyên khối dưới 1 key duy nhất — mọi `saveState()` dù nhỏ đều serialize lại TOÀN BỘ (kể cả `body`/`nutrition`/`goals` khi các module này phình to ở Giai đoạn B sau). Ảnh hưởng: ngưỡng `QuotaExceededError` đến sớm hơn theo thời gian; không có cơ chế đọc/ghi từng phần theo module. Đây là coupling ở tầng lưu trữ vật lý, KHÔNG phải coupling logic (các hàm xử lý các vùng dữ liệu độc lập nhau).

---

## PHẦN B — Kết quả kiểm chứng runtime (Claude Preview MCP, Chromium — không phải iPhone thật)

Tổng hợp các phép đo/test thực tế đã thực hiện qua trình duyệt thật (không chỉ đọc code):

1. **Cold-load timing thật** (Navigation Timing API): ~1.1 giây tổng, ~920ms trước khi tương tác được — khớp với phát hiện tĩnh về các khối parse đồng bộ lớn (mascot base64 + script chính + catalog).
2. **Cache Storage thật** (`caches.keys()`, `cache.match()`): phát hiện (a) `sogym-cache-v3` chứa HTML của các bản cũ từ tận A7_v6 — tăng trưởng không giới hạn (🟠 High, Nhóm 11); (b) `sogym-images-v1` có 1 entry ảnh URL `.../undefined/0.jpg` bị cache vĩnh viễn dưới dạng opaque response — dẫn tới phát hiện bug `thumbHTML()` inconsistency (🟠 High, Nhóm 9).
3. **Responsive/overflow test** ở 320px và 375px cho cả 5 tab: 0 tràn ngang, nav icon active/inactive đúng, 0 console error.
4. **Search performance thật**: gõ liên tục vào ô tìm kiếm 873 bài — đo ~40–70ms/lần render, không cần debounce ở quy mô hiện tại.
5. **Corrupt-localStorage test thật**: giả lập JSON hỏng trong `sogym_data_v1`, xác nhận `loadState()` bắt lỗi đúng qua đường Restore/tab Lịch sử (không mâu thuẫn với 🔴 Critical Nhóm 20 — đó là đường boot bình thường, chưa được bọc).
6. **`preview_network` (filter: failed)**: không có failed request nào trong phiên test — không phát hiện lỗi mạng ẩn.

---

## Việc KHÔNG làm trong audit này (đúng phạm vi Bước 1)

- KHÔNG sửa bất kỳ dòng code nào trong `SoGym_A9_v4.html` hay `SW_A7_v2.js`.
- KHÔNG đề xuất phương án tối ưu cụ thể (đó là Bước 2, chỉ thực hiện sau khi có xác nhận của user cho báo cáo này).
- KHÔNG test trên iPhone thật — mọi finding Nhóm 22/23 liên quan Safari/iOS đều gắn nhãn "chưa test trên iPhone thật" và cần xác nhận lại bằng thiết bị thật ở vòng sau.
- KHÔNG đụng tới kiến trúc đã chốt: single-file HTML, localStorage-only, 3-script-block split, base64 asset embedding, ES5-only.

---

## Bảng tổng hợp toàn bộ finding theo mức độ (24 nhóm)

| Mức độ | Số lượng | Danh sách (nhóm) |
|---|---|---|
| 🔴 Critical | 2 | Boot crash risk từ `history` null (N20); Mascot base64 66.5% file, parse đồng bộ chặn render (N17/N18) |
| 🟠 High | 6 | `loadState()` fail âm thầm (N20); `runIntegrityCheck()` gap ở boot (N21, cùng gốc N20); SheetJS blocking script trong `<head>` (N17); `renderHistory()` không giới hạn quy mô (N14); thumbnail `undefined` bị cache (N9); SW cache HTML cũ tăng trưởng không giới hạn (N11); thiếu `viewport-fit=cover` (N22) — *lưu ý: 7 mục nhưng 1 cặp N20/N21 là cùng 1 root cause đếm 1 lần trong Tóm tắt điều hành* |
| 🟡 Medium | ~14 | Hàm quá lớn (N1); date-format lặp (N3); 3 hàm combo giống nhau (N3); rebind listener thay vì delegation (N4); SheetJS không được SW cache (N11); checkAndArchiveStaleSession trigger renderHistory ở boot (N14/N17); search không debounce (N13); history/state không giới hạn (N16, x2); FileReader thiếu onerror (N20); font-size gây zoom Safari (N22); modal + bàn phím ảo (N22); Add to Home Screen UX sau cài đặt (N23); blob JSON nguyên khối (N24) |
| 🟢 Low/Clean | ~30+ | Đã liệt kê chi tiết theo từng nhóm ở trên — phần lớn N7/N8/N10/N12/N13/N15/N19/N21 là "đã kiểm tra, không có vấn đề" |
| 🔵 Cosmetic | 7 | 3 cơ chế base64 song song (N5); inline style dài (N5); onclick inline (N6); comment changelog khổng lồ (N18); orientation/landscape (N22); title version lệch (N22) |

---

---

## PHẦN C — RÀ SOÁT SÂU VÒNG 2 (deep latent-bug re-audit, theo yêu cầu user)

**Lý do:** user yêu cầu quay lại Bước 1, rà thật kỹ để chắc chắn không sót **lỗi logic tiềm ẩn** — loại lỗi chỉ lộ ra với dữ liệu/edge-case cụ thể (giống bug `normalizeDataModelV3` bỏ sót null tìm ra khi phân tích Bước 2). **Phương pháp:** 4 agent độc lập soi song song 4 cụm (data lifecycle / rendering-calc / date-number-timer / async-network) + tôi đọc lại tận nơi từng finding quan trọng để **tự kiểm chứng** trước khi ghi nhận (loại bỏ false-positive). Vẫn KHÔNG sửa 1 dòng code nào.

### Finding MỚI đã kiểm chứng (bổ sung cho PHẦN A)

**🟠 C1 — Có THÊM đường crash boot cùng lớp lỗi với 🔴 Critical Nhóm 20 (không phải chỉ `renderHistory`).**
`computeHistoryUsageCounts()` (dòng 1105–1109) chạy `state.history.forEach(function(sess){ (sess.exercises||[])... })` — `||[]` chỉ bảo vệ `sess.exercises`, KHÔNG bảo vệ `sess` bản thân là `null` → `sess.exercises` throw. Hàm này bị gọi ở boot qua `renderHome()` → `isFavorite()` (khi có phiên tập đang mở với bài đã thêm). Tương tự, `allTimeMaxByExercise()` (dòng 2358) cũng deref `sess.exercises` không guard (chạy khi Xuất Excel/CSV). ⇒ **Ý nghĩa quan trọng cho Bước 2/3:** bọc try/catch riêng `renderHistory` là KHÔNG đủ; phải sửa tại **gốc chốt chung** `normalizeDataModelV3` (lọc phần tử null khỏi `history`) — vì chốt này chạy trên cả read (loadState 972) lẫn write (saveState 947), nên vá 1 chỗ bịt toàn bộ các đường (renderHome, renderHistory, computeHistoryUsageCounts, allTimeMaxByExercise, cả luồng Restore). *Đã đọc tận nơi, xác nhận.*

**🟠 C2 — KHÔNG escape HTML ở bất kỳ đâu → text người dùng nhập chứa `<` hoặc `"` làm vỡ layout/mất chữ.**
Grep xác nhận toàn file KHÔNG có hàm `escapeHtml`; chỗ duy nhất escape là dòng 1155 (giá trị `<option>`). Các trường free-text người dùng nhập được nhét thẳng vào `innerHTML`: ghi chú cơ thể (2203 `r.body.note`), tên/nhóm cơ bài tự thêm (1207 `ex.name`/`ex.sub`, 1899–1900, 1446 qua `resolvedName/Sub`), loại cardio tự gõ (1251, 1907), và trong thuộc tính `title="..."` (1209, 1447). Ví dụ: ghi chú `5kg < 10kg` sẽ **mất toàn bộ chữ sau dấu `<`**; tên bài chứa dấu `"` làm hỏng thuộc tính `title`. Rủi ro bảo mật thấp (app cá nhân, dữ liệu của chính mình, offline) nhưng là **lỗi hiển thị/đúng-đắn thật sự**. *Đã grep + đọc tận nơi, xác nhận.*

**🟠 C3 — Đồng hồ nghỉ (rest timer) KHÔNG bị dừng khi rời màn Nhập set qua thanh nav → banner "hết giờ nghỉ" hiện lạc ở màn khác + tick nền lãng phí.**
`switchScreen()` (3057–3090) không hề gọi `stopRestTimer()`. `showScreen('log')` cũng ủy quyền qua `switchScreen` (3101). Kịch bản: bấm Bắt đầu nghỉ ở màn Nhập set → chạm tab "Hôm nay"/"Lịch sử" khi đang đếm → `setInterval` (1782) vẫn chạy nền, `restSecondsLeft` vẫn giảm, và khi về 0 sẽ bắn `showRestDoneBanner()` (1787) trên màn không liên quan; đồng thời `updateRingUI()` vẫn ghi style vào phần tử `#ring` off-screen mỗi giây. Chỉ `btnFinishExercise`/`resetRestTimer`/luồng restore-reset mới dừng timer, còn điều hướng thường thì không. *Đã đọc `switchScreen` + `showScreen`, xác nhận không có `stopRestTimer`.*

**🟡 C4 — `renderGoalGrid()` hiển thị SAI chỉ số "hiện tại" khi bản ghi ngày mới nhất thiếu 1 chỉ số.**
`latestBodyEntry()` (2007–2009) trả về DUY NHẤT 1 dòng có `dateISO` mới nhất; `renderGoalGrid` (2064–2069) đọc chỉ số từ đúng dòng đó. Kịch bản: 20/08 nhập cân nặng=70 (bỏ trống %mỡ/%cơ); 21/08 chỉ nhập %mỡ. `latestBodyEntry` trả dòng 21/08 có `weight=null` → thẻ "Cân nặng" hiện `—` dù thực tế có cân nặng thật từ 1 ngày trước. Đúng ra mỗi chỉ số phải tự tìm giá trị non-null mới nhất của riêng nó. *Đã đọc tận nơi, xác nhận.*

**🟡 C5 — Luồng Khôi phục ghi đè + persist dữ liệu local TRƯỚC khi validate xong (commit-before-validate).**
Restore JSON (2617 `saveState()` → 2622 `runIntegrityCheck()` → 2630 render) và Restore Google Sheets đều ghi state + `saveState()` trước, dọn/kiểm sau. Nếu 1 lớp hỏng lọt qua integrity check và render throw (bị bắt ở 2633), dữ liệu local (đã bị thay thế) coi như mất. **Giảm nhẹ:** có confirm rõ ràng của user + integrity check + try/catch; và nếu áp bản sửa gốc C1 (`normalizeDataModelV3` lọc null, chạy trong `saveState`) thì luồng này cũng được bảo vệ theo. ⇒ Xếp mức hardening, gắn cùng Batch 1, không phải Critical.

**🟡 C6 — `thumbHTML()` không guard `id` rỗng/undefined (điều chỉnh lại finding Nhóm 9).**
*Đính chính finding cũ:* kiểm chứng lại cho thấy **cả 3 call site đều ĐÚNG** với data hiện tại — `sessionExercises` lưu `catalogId` khi push (≈1542), object catalog gốc dùng `.id`; nên 1206/1652 dùng `ex.catalogId` và 1445 dùng `ex.id` là chính xác, KHÔNG phải "call-site inconsistency" như PHẦN A/Nhóm 9 viết. Nguồn thật của entry cache `.../undefined/0.jpg` là **dữ liệu cũ/edge** (session cũ trước khi có field `catalogId` → `ex.catalogId` = undefined). Bản chất finding vẫn đúng nhưng cách sửa gọn hơn: guard ngay trong `thumbHTML` (id rỗng → trả thẳng ảnh fallback), không cần đụng 3 call site.

**🟡 C7 — Xuất Excel/CSV gộp nhầm PR khi 2 bài trùng TÊN hiển thị.**
`allTimeMaxByExercise()` (2360) khóa theo `ex.name` (tên hiển thị) thay vì id ổn định. Nếu 2 bài khác nhau trùng tên, hoặc 1 bài từng bị đổi tên, phần "kỷ lục mọi thời" trong sheet xuất ra bị gộp/gán nhầm giữa các bài. Chỉ ảnh hưởng file xuất, không hỏng dữ liệu gốc. *Từ agent, hợp lý qua đọc code — nên xác nhận thêm bằng test ở vòng sau.*

**🟢 C8 — `Promise.prototype.finally` (2817, 2860) — rủi ro tương thích Safari cũ (chưa test iPhone thật).**
`gsheetBackup`/`gsheetRestore` dùng `.finally()` để bật lại nút. `.finally` chỉ có từ Safari 11.1+; không có polyfill. Trên Safari rất cũ, chuỗi ném lỗi ngay khi dựng và nút Sao lưu/Khôi phục **kẹt disabled vĩnh viễn**. iPhone đời mới không sao; ghi nhận theo tinh thần offline-first + ES5-everywhere. **chưa test trên iPhone thật.**

**🟢 C9 — Nhóm Low/minor (ghi nhận, ưu tiên thấp):**
- `loadState` (978) và Restore (2609) gán `state.sessionDateISO = saved/data.sessionDateISO` thiếu `|| null` như các dòng anh em — vô hại vì `checkAndArchiveStaleSession` (1358) đã guard, chỉ là thiếu nhất quán.
- `SoGymDataStore.read` (852) tự GHI ĐÈ blob đã migrate ngay khi đọc (side-effect trên read) mà không backup — rủi ro thấp vì `migrateData` chỉ THÊM field, không xoá; nhưng phá vỡ nguyên tắc "read không mutate".
- `makeStableId` (897): về lý thuyết có thể trùng khi normalize hàng loạt workout thiếu id trong cùng 1 mili-giây (xác suất ~1/36⁶/cặp) — rất thấp.
- Multi-tab: `resetAllData` ở tab A + `saveState` ở tab B trong khe hở giữa `removeItem` và sự kiện `storage` async có thể ghi ngược dữ liệu đã xoá — cửa sổ hẹp, đã được dev thu hẹp bằng reload-on-null (3115), không đóng hẳn.

### False-positive đã LOẠI sau khi tự kiểm chứng (ghi lại để minh bạch, tránh báo động giả)

- ❌ **"Sai calo 1000× do formatter vs parser"** — KHÔNG phải bug. Luồng lưu đã `.replace(/\./g,'')` bỏ dấu phân hàng ngàn TRƯỚC `strictParseNumber` (dòng 2266 cho `btnSaveBody`, dòng 1310 cho `btnSaveCardio`); output "8.000" của formatter không bao giờ được đưa thẳng vào parser. Đã có comment giải thích ở 3161–3162. *Đã đọc tận nơi.*
- ❌ **"renderBodyChart chia cho 0 / NaN / 1 điểm"** — CLEAN, đã guard `points.length<2` và `minV===maxV`. *Kiểm chứng khớp.*
- ❌ **"gsheetApiFetch lặp vô hạn khi 401"** — cờ `isRetry` chặn retry lần 2, không có vòng lặp vô hạn. CLEAN.
- ❌ **"Bẫy ES5 var-in-loop closure ở danh sách restore Google Sheets"** — dùng `items.forEach(function(item){...})` (tham số theo từng vòng lặp), KHÔNG dính bẫy. CLEAN.
- ❌ **"updateBackupReminder / freqPerWeek sai do `new Date('yyyy-mm-dd')` parse UTC"** — cả 2 toán hạng cùng chịu offset UTC-midnight nên triệt tiêu, hiệu số ngày vẫn đúng. CLEAN.
- ❌ **"Math.max.apply trên mảng rỗng ra -Infinity"** — mọi call site đều guard `sets.length>0` hoặc nằm trong `sets.forEach`. CLEAN.

### Cập nhật bảng tổng hợp sau Vòng 2

| Mức độ | Thay đổi so với PHẦN A |
|---|---|
| 🔴 Critical | Vẫn **2** (không phát sinh Critical mới) — nhưng lớp lỗi null-history nay có THÊM đường crash (C1) ⇒ củng cố mạnh việc phải sửa tại gốc `normalizeDataModelV3`, không vá cục bộ |
| 🟠 High | +3 mới đã kiểm chứng: C1 (đường crash boot phụ), C2 (không escape HTML), C3 (rest timer không dừng khi đổi tab) |
| 🟡 Medium | +4: C4 (goal grid sai chỉ số hiện tại), C5 (restore commit-before-validate), C6 (thumbHTML thiếu guard — đính chính Nhóm 9), C7 (PR trùng tên khi xuất) |
| 🟢 Low | +C8 (Promise.finally Safari cũ), +C9 (nhóm minor) |

**Kết luận Vòng 2:** không phát sinh Critical mới, nhưng đã bắt được **7 lỗi logic tiềm ẩn thật** chưa có trong PHẦN A (C1–C7) và loại **6 false-positive**. Phát hiện quan trọng nhất là C1: khẳng định hướng sửa gốc (lọc null tại `normalizeDataModelV3`) là đúng và cần thiết — nếu chỉ bọc `renderHistory` sẽ còn sót đường crash qua `renderHome`/`computeHistoryUsageCounts` và xuất Excel.

---

**Dừng tại đây theo đúng quy trình Bước 1.** Chờ user xem xét/xác nhận danh sách finding này (PHẦN A + C) trước khi chuyển sang Bước 2 (đề xuất phương án tối ưu). Không có thay đổi code nào được thực hiện.
