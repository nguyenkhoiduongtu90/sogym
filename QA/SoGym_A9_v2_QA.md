# QA — SoGym_A9_v2.html — Fix 2 lỗi tab Cơ thể + nhúng 22 hình ảnh mới (mục 5–9)

**Ngày:** 2026-08-22
**File:** `SoGym_A9_v2.html` (copy từ `SoGym_A9_v1.html` — v1 đã báo cáo cho user nên không được edit in-place theo quy tắc dự án)
**SW:** không đổi, vẫn `SW_A7_v2.js`
**Trạng thái:** Đã sửa + nhúng ảnh + test thật kỹ qua Claude Preview MCP (DOM thật, network thật, không mock), user đã cho phép push thay `SoGym_A8_v4.html`.

## Bối cảnh
Sau khi báo cáo `SoGym_A9_v1.html` (hệ thống modal tự thiết kế), user test thật trên iPhone tab Cơ thể và phản hồi trong 1 tin nhắn gồm 4 việc:
1. Ô "Calo nạp (kcal)" chưa có dấu phân cách hàng ngàn như mục tiêu, dù báo đã xong — yêu cầu sửa **thật sự**, không phỏng đoán, và rà soát các chỗ tương tự.
2. Ô "Mục tiêu (bấm để sửa)" cần giới hạn bàn phím chỉ nhập được nội dung phù hợp.
3. Giả lập 1–2 tình huống lỗi cho việc #1/#2, đưa giải pháp.
4. Nhúng 22 ảnh mới giao ở `pics/` (theo `pics/SoGym_Prompt_VeHinh.md` mục 5–9) vào app, giả lập 3–4 tình huống lỗi riêng cho ảnh.

Sau khi hoàn tất cả 4 việc, user cho phép: **"push SoGym_A9_v2.html lên GitHub thay SoGym_A8_v4.html"**.

## Phần 1 — Fix lỗi #1: dấu phân cách hàng ngàn cho Calo

### Vì sao báo "đã xong" ở A8_v3 mà v4 vẫn lỗi
Kiểm tra lại `loadBodyFormForDate()`: hàm `fmtKcal()` (đã viết ở A8_v3) chỉ được áp dụng cho ô hiển thị **lịch sử/mục tiêu**, KHÔNG được gọi khi đổ dữ liệu ngày đã lưu vào chính ô nhập `#nutriCalInp` — đây là thiếu sót thật trong phạm vi áp dụng, đúng như user chỉ ra, không phải hiểu lầm của user.

### Sửa
- `loadBodyFormForDate()`: `nutriCalInp.value` giờ dùng `fmtKcal(n.calories)` thay vì gán số thô.
- Thêm `attachThousandInputFormatter(id)`: định dạng dấu "." hàng ngàn **khi đang gõ** (live), tự tính lại vị trí con trỏ theo số chữ số đứng trước (không theo số ký tự, vì dấu "." chèn/xoá làm lệch chỉ số ký tự) — gắn cho `nutriCalInp`.
- Khi lưu (`btnSaveBody`): `cRaw = cEl.value.trim().replace(/\./g,'')` — bóc dấu "." trước khi `strictParseNumber()`, tránh bẫy đã lường trước: `strictParseNumber("8.000")` sẽ hiểu nhầm thành `8` (coi "." là thập phân) nếu không bóc trước.
- `nutriCalInp` bị gỡ khỏi `NUMERIC_ONLY_IDS` (cơ chế lọc ký tự cũ, per-id tĩnh) vì giờ dùng cơ chế định dạng riêng (`attachThousandInputFormatter`) thay thế hoàn toàn, tránh 2 listener `input` cùng sửa `.value` giẫm lên nhau.

### Rà soát cùng lớp lỗi ở nơi khác (theo đúng yêu cầu user — "1 lỗi xuất hiện ở nhiều chỗ")
Grep toàn file các nơi hiển thị/nhập số nguyên lớn dạng đếm-được (kcal, không phải kg/%) → phát hiện **`cardioCal`** (ô "Calo" trong form Thêm Cardio) bị lỗi **giống hệt**, chưa từng được sửa:
- `cardioCal` gỡ khỏi `NUMERIC_ONLY_IDS`, gắn `attachThousandInputFormatter('cardioCal')`.
- `btnSaveCardio`: `calRaw = calEl.value.trim().replace(/\./g,'')` trước khi parse.
- 2 nơi hiển thị lại calo cardio (danh sách buổi tập hôm nay + chi tiết Lịch sử) đổi từ nối chuỗi số thô `c.cal+' kcal'` sang `fmtKcal(c.cal)+' kcal'`.

## Phần 2 — Fix lỗi #2: giới hạn bàn phím ô "Mục tiêu"

### Vì sao không dùng lại `NUMERIC_ONLY_IDS` (cơ chế cũ)
`#appModalInput` là **1 phần tử DOM duy nhất được tái sử dụng** cho mọi lời gọi `showAppPrompt()` trong toàn app (sửa Reps, sửa Tạ, đặt Mục tiêu, gõ "XÓA" xác nhận...) — không có id cố định gắn riêng theo ngữ cảnh, nên cơ chế lọc tĩnh theo id (`NUMERIC_ONLY_IDS`) không áp dụng được. Cần lọc **động** theo loại giá trị đang nhập tại thời điểm mở modal.

### Sửa
- `openAppModal(opts)` nhận thêm `opts.inputMode` (`'integer'` | `'decimal'` | mặc định text), lưu vào biến module `_appModalInputMode`, đồng thời set thuộc tính HTML `inputmode` tương ứng (gợi ý bàn phím số trên điện thoại thật).
- `showAppPrompt(message, defaultValue, inputMode)` — thêm tham số thứ 3, truyền xuống `openAppModal`.
- 1 listener `input` gắn 1 lần duy nhất trên `#appModalInput` lúc khởi tạo: nếu `_appModalInputMode==='integer'` chỉ giữ chữ số; nếu `'decimal'` giữ chữ số + tối đa 1 dấu `.`; nếu `'text'` bỏ qua (không lọc) — tự tính lại vị trí con trỏ theo số ký tự bị xoá trước con trỏ.
- Gắn `inputMode` cho từng nơi gọi thực tế: sửa Reps → `'integer'` (2 chỗ: đang tập + Lịch sử), sửa Tạ → `'decimal'` (2 chỗ), đặt Mục tiêu → động theo loại chỉ số (`renderGoalGrid()`: cân nặng/%mỡ/%cơ → `'decimal'`, calo → `'integer'`). Ô gõ "XÓA" xác nhận xoá dữ liệu **giữ nguyên** không truyền `inputMode` (mặc định text, vì cần gõ được chữ).

## Phần 3 — Giả lập lỗi cho Phần 1 + Phần 2 (test thật qua Claude Preview MCP)

| # | Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|---|
| 1 | Gõ "8000" liên tục vào `#nutriCalInp`, kiểm tra giá trị hiển thị sau mỗi ký tự | Hiện dần "8", "80", "800", "8.000" — dấu "." tự chèn đúng lúc, không giật con trỏ về cuối | PASS |
| 2 | Gõ số ở giữa chuỗi đã có dấu "." (vd con trỏ đặt giữa "8.000" rồi gõ thêm "5") | Con trỏ giữ đúng vị trí tương đối theo số chữ số, không nhảy lung tung | PASS |
| 3 | Lưu chỉ số với Calo = "8.000" đã định dạng, đọc lại `state` sau `saveState()` | Lưu đúng số `8000` (không phải `8`) — xác nhận bẫy `strictParseNumber("8.000")` đã được né đúng như thiết kế | PASS |
| 4 | Mở modal sửa Tạ (decimal), gõ "12.5.3" (2 dấu chấm) | Chỉ giữ dấu chấm đầu tiên, thành "12.53" | PASS |
| 5 | Mở modal đặt Mục tiêu Calo (integer), gõ "abc123.5xyz" | Chỉ còn "1235" (bỏ hết chữ + dấu chấm vì integer mode) | PASS |
| 6 | Mở modal gõ "XÓA" xác nhận xoá dữ liệu, gõ chữ có dấu | Gõ được bình thường, không bị lọc (đúng vì không truyền `inputMode`) | PASS |

## Phần 4 — Nhúng 22 ảnh mới (`pics/`, theo `pics/SoGym_Prompt_VeHinh.md` mục 5–9)

Mục 1–4 (nền, icon 2 nút chính màn Hôm nay, 4 icon tab nav, ảnh empty-state) đã nhúng từ trước (A7_v5), không đổi ở bước này.

### Phát hiện quan trọng TRƯỚC khi nhúng — kích thước ảnh giao không đúng spec
Kiểm tra `pics/` bằng PIL trước khi nhúng (không nhúng ngay theo phản xạ) phát hiện **toàn bộ 22 ảnh** đều có kích thước thật **1254×1254px** (không phải 256/128/512px theo spec từng nhóm), nặng 900KB–1.5MB/ảnh, tổng **~24.4MB** — nếu nhúng thẳng base64 sẽ làm file HTML phình to gấp ~17 lần, ảnh hưởng nghiêm trọng tới thời gian tải lần đầu và giới hạn `localStorage`/bộ nhớ trên iPhone thật.

**Xử lý:** viết script Python (PIL/Pillow) resize từng ảnh đúng kích thước spec theo nhóm (LANCZOS resample), tối ưu PNG (`optimize=True`, quantize 64-màu cho icon ≤256px; giữ nguyên màu cho 8 mascot 512px vì chi tiết gradient nhiều hơn, quantize sẽ lộ răng cưa). Kết quả: **24.4MB → 2.7MB (~89% giảm)**. Kiểm tra trực quan 1 số ảnh đại diện sau resize (logset, mascot_01, fav_on, savebody, navicon_body ở đúng kích thước hiển thị thật 22px, fallback_thumb) — không thấy vỡ màu/răng cưa do quantize.

### Danh sách đã nhúng
| Vị trí | File nguồn | Cách nhúng |
|---|---|---|
| Tab nav "Cơ thể" | `sogym_navicon_body.png` (128px) | `<img class="nav-icon">` tĩnh, thay `<span class="nav-icon-emoji">⚖️</span>` |
| Nút "Ghi nhận set" | `sogym_btnicon_logset.png` (256px) | `<img class="btn-icon">` tĩnh trước label |
| Nút "Bắt đầu nghỉ/Tạm dừng/Tiếp tục" | `sogym_btnicon_startrest.png` (256px) | Hằng số JS `ICON_STARTREST`, gắn qua `innerHTML` trong `updateRingUI()` (nút này bị JS ghi đè nội dung liên tục theo trạng thái đếm giờ) |
| Nút "Kết thúc buổi tập" | `sogym_btnicon_endsession.png` | `<img class="btn-icon">` tĩnh |
| Nút "Xuất Excel" | `sogym_btnicon_exportcsv.png` | `<img class="btn-icon">` tĩnh, bỏ emoji ⇩ cũ |
| Nút Backup JSON (icon-only) | `sogym_btnicon_backupjson.png` | `<img class="btn-icon">` tĩnh, bỏ emoji 💾, `margin-right:0` vì không có label |
| Nút "Xóa toàn bộ dữ liệu" | `sogym_btnicon_resetall.png` | `<img class="btn-icon">` tĩnh, bỏ emoji 🗑 |
| Nút "Sao lưu lên Google Sheets" | `sogym_btnicon_gsheetbackup.png` | `<img class="btn-icon">` tĩnh, bỏ emoji ☁️ |
| Nút "Khôi phục từ Google Sheets" | `sogym_btnicon_gsheetrestore.png` | `<img class="btn-icon">` tĩnh, bỏ emoji ⬇ |
| Nút "Lưu chỉ số" | `sogym_btnicon_savebody.png` | `<img class="btn-icon">` tĩnh |
| Nút ★/☆ yêu thích (4 nơi: 2 template render, 2 click handler — màn Hôm nay + Chọn bài) | `sogym_glyph_fav_on.png`/`_off.png` (128px) | Hàm dùng chung mới `favIconHTML(fav)`, thay `textContent` bằng `innerHTML` ở 2 handler |
| Nút copy set trước (⧉) | `sogym_glyph_copyprev.png` | Hằng số `COPY_PREV_ICON`, chèn `<img class="copy-prev-icon">` trong template |
| Ảnh đại diện bài tập khi lỗi tải | `sogym_fallback_exercise_thumb.png` (256px) | Hằng số `FALLBACK_THUMB_SRC`, `thumbHTML()` đổi `onerror` từ `textContent='🏋'` sang `this.onerror=null;this.src=FALLBACK_THUMB_SRC;` (chặn lặp vô hạn nếu ảnh gốc lỗi) |
| Icon splash/mascot | `sogym_mascot_01..08.png` (512px) | `mascot_01` nhúng tĩnh làm `src` mặc định của `#splashIcon` (hiện ngay, không chờ JS); `<script>` chèn ngay sau `</div>` đóng `#splashScreen` chứa mảng 7 mascot còn lại + `Math.floor(Math.random()*8)` chọn ngẫu nhiên đều 1/8 mỗi con |

Riêng `sogym_glyph_remove.png` (icon cho nút ✕ xoá set) **chưa được giao** — nút ✕ giữ nguyên ký tự Unicode như cũ, không chặn các phần còn lại. Đã ghi chú rõ trong code (khối hằng số "A9_v2 — ICON ẢNH NHÚNG BASE64").

### Cách áp dụng an toàn (tránh sửa tay 1 file HTML 5MB dễ gõ nhầm)
Viết script Python đọc base64 từng ảnh trực tiếp từ `pics/resized/b64/*.txt` (không load qua ngữ cảnh chat, tránh tốn token) và thay thế theo từng cặp chuỗi cũ→mới, có hàm `do_replace()` tự kiểm tra đúng số lần xuất hiện mong đợi — nếu lệch (0 lần hoặc nhiều hơn dự kiến) thì dừng ngay, KHÔNG ghi file, báo lỗi rõ ràng. Lần chạy đầu phát hiện 1 lệch thật (2 vị trí toggle ★/☆ trong click-handler thụt lề khác nhau — 8 và 10 dấu cách — nên chuỗi tìm chỉ khớp 1/2), sửa script tách thành 2 phép thay riêng theo đúng thụt lề, chạy lại: cả 21 phép thay đều khớp đúng số lần dự kiến trước khi file được ghi.

## Phần 5 — Giả lập lỗi cho ảnh (test thật qua Claude Preview MCP, network thật)

| # | Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|---|
| 1 | Ảnh nguồn sai kích thước/quá nặng (1254px thay vì spec, ~24MB tổng) | Phát hiện trước khi nhúng, xử lý resize+tối ưu, không để lọt vào bản chính thức | PASS — giảm còn 2.7MB trước khi nhúng |
| 2 | Ảnh bài tập lỗi tải thật (trỏ URL bài tập không tồn tại → lỗi mạng 404 thật từ GitHub, không phải giả lập) | Tự động chuyển sang `FALLBACK_THUMB_SRC`, ảnh thay thế tải thành công (256×256), không lặp vô hạn | PASS |
| 3 | Icon động `btnStartRest` bị ghi đè `innerHTML` liên tục (mỗi giây khi đếm giờ chạy) qua 4 trạng thái text khác nhau (Bắt đầu nghỉ/Tạm dừng/Tiếp tục) | Icon còn nguyên, tải đúng (`complete && naturalWidth>0`) ở cả 4 trạng thái | PASS |
| 4 | Script random mascot chạy nhiều lần tải trang (reload) liên tiếp | Mascot đổi khác nhau giữa các lần tải (xác nhận qua 3 lần reload, mascot khác nhau mỗi lần), ảnh nào cũng tải đúng 512×512, không có lần nào trống/vỡ | PASS |

Ngoài 4 kịch bản trên còn xác nhận thêm (không tính là kịch bản lỗi riêng, nhưng liên quan trực tiếp tới rủi ro ảnh): nút ★/☆ bấm thật đổi icon đúng qua lại (class `is-fav` + src ảnh đổi), nút copy-prev-set hiện icon đúng (128×128) ngay sau khi ghi 1 set thật qua luồng UI đầy đủ (không mock state).

## Hồi quy (đảm bảo không phá gì đã có ở A9_v1 lẫn A8_v4)
| Kịch bản | Kết quả |
|---|---|
| Sweep cả 5 tab (Hôm nay/Chọn bài/Nhập set/Lịch sử/Cơ thể) sau khi nhúng ảnh | 0 console error |
| Service Worker (`SW_A7_v2.js`) vẫn đăng ký thành công với file 5MB | PASS — 1 registration, đúng scope |
| Grep xác nhận các hằng số/hàm của Phần 1+2 (`fmtKcal`, `attachThousandInputFormatter`, `_appModalInputMode`, `NUMERIC_ONLY_IDS`) còn nguyên sau khi script nhúng ảnh chạy | PASS — không bị script ảnh đè/xoá nhầm |
| Không còn placeholder `@...@` sót lại trong file (kiểm tra bằng grep sau khi ghi) | PASS — 0 kết quả |

## Kích thước file
`SoGym_A9_v1.html`: ~1.39MB (chưa có ảnh mục 5–9) → `SoGym_A9_v2.html`: **~4.7MB** (đã nhúng 22 ảnh tối ưu, thay 2 bugfix). Tăng do 8 mascot 512px (nặng nhất, ~2.8MB tổng cho 7 ảnh nhúng qua script + 1 ảnh nhúng tĩnh) là phần chiếm dung lượng lớn nhất trong số ảnh mới; các icon nút/glyph còn lại chỉ ~350KB tổng.

## Việc KHÔNG làm
Không đổi `DATA_SCHEMA_VERSION` (vẫn 3). Không đổi SW. Không đổi ngưỡng `BODY_SANITY_BOUNDS`. Không nhúng `sogym_glyph_remove.png` (chưa được giao). Không đổi cơ chế cache ảnh bài tập (`IMG_BASE` on-demand + SW cache riêng, không liên quan tới các ảnh UI tĩnh nhúng base64 ở bước này).

## Xác nhận từ user
User đã xác nhận cho phép **push `SoGym_A9_v2.html` lên GitHub thay `SoGym_A8_v4.html`** (đang live) sau khi hoàn tất toàn bộ 4 việc trên.
