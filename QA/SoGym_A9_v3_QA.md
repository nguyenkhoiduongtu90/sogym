# QA — SoGym_A9_v3.html — Fix 4 lỗi icon/kích thước sau test thật trên điện thoại

**Ngày:** 2026-08-22
**File:** `SoGym_A9_v3.html` (copy từ `SoGym_A9_v2.html` — v2 đã báo cáo cho user và push lên GitHub nên không được edit in-place theo quy tắc dự án)
**SW:** không đổi, vẫn `SW_A7_v2.js`
**Trạng thái:** Đã sửa + test thật kỹ qua Claude Preview MCP (DOM thật, luồng UI thật, không mock) + đã giả lập lỗi theo đúng yêu cầu, phát hiện thêm 1 lỗi hình ảnh thật (ngoài 4 lỗi user báo) và đã sửa. **Chờ user xác nhận trước khi push.**

## Bối cảnh
Sau khi push `SoGym_A9_v2.html`, user test thật trên điện thoại và báo trong 1 tin nhắn gồm 4 lỗi + yêu cầu quy trình:
1. Icon tại các nút chức năng hơi nhỏ — tăng thêm 75% kích thước.
2. Icon tab "Cơ thể" (`sogym_navicon_body`) chưa tách nền giống 4 tab còn lại — kiểm tra lại; tương tự một số icon khác vẫn còn nền đen/xanh sót lại, màu chưa đồng nhất, trong khi nền thật của nút đó không phải màu đó.
3. Đồng hồ đếm ngược giờ nghỉ giữa set (hiển thị "01:00") to ra thêm 20%.
4. Icon bút chì (✎ sửa) quá nhỏ — trên điện thoại tay to bấm nhầm sang icon thùng rác (🗑 xoá) kế bên — chỉnh lại kích thước.

Yêu cầu quy trình đi kèm: "Test lại các icon, màu sắc, sửa chữa, đưa ra phương án tối ưu để thực hiện, tiếp tục đưa ra 3-5 tình huống giả định sai sót về mặt chức năng và 2-3 tình huống về mặt hình ảnh để tìm kiếm phát hiện và chỉnh sửa" — bắt buộc phải giả lập lỗi và tự tìm-sửa trước khi báo cáo lại.

## Phần 1 — Điều tra nguyên nhân gốc lỗi #2 (nền/màu icon chưa đồng nhất)

Dùng PIL đọc trực tiếp base64 đang nhúng thật trong `SoGym_A9_v2.html`:
- 4 icon tab nav gốc (Hôm nay/Chọn bài/Nhập set/Lịch sử, nhúng từ đợt A7_v5) là **RGBA thật**, kênh alpha có dải mờ liên tục (feathered, không phải mặt nạ nhị phân) → đã được tách nền đúng cách từ trước.
- `navicon_body` và toàn bộ icon mới nhúng ở A9_v2 (8 btn-icon + 4 icon JS) là **mode `P` (palette, không alpha)** — xác nhận đúng như user báo: **chưa từng được tách nền**, chỉ là ảnh nền đặc (đen/xanh tuỳ ảnh AI vẽ ra) dán đè lên nút.

Đối chiếu `pics/SoGym_Prompt_VeHinh.md`: tài liệu spec đã lường trước AI vẽ ảnh không tạo được nền trong suốt thật, và có ghi sẵn "phương án dự phòng" là tách nền (matting) nếu cách vẽ trực tiếp trên nền đặc để lộ viền lệch — đúng tình huống lỗi user gặp. Spec cũng cho bảng màu tiền cảnh chuẩn theo từng icon (vd `logset`→`#c6ff3d`, `exportcsv`→`#1a2600` vì vẽ trên nền lime, `endsession`/`resetall`→`#ff6b4a`...).

## Phần 2 — Giải pháp: pipeline tách nền + ép màu chuẩn (`​.scratch/matte_icons.py`)

Xử lý lại từ ảnh gốc độ phân giải cao (`pics/sogym_*.png`, 1254×1254, chưa qua nén) để tránh cộng dồn nhiễu dither của bản đã resize trước đó:
1. Tìm màu nền chiếm ưu thế (quantize 128×128, lấy màu xuất hiện nhiều nhất).
2. Tính alpha theo khoảng cách màu từng pixel tới màu nền: dưới ngưỡng 22 → alpha 0 (nền thật), trên ngưỡng 60 → alpha 255 (tiền cảnh thật), ở giữa nội suy tuyến tính (viền mềm, chống răng cưa).
3. **Ép toàn bộ pixel có alpha>0 về đúng mã hex chuẩn theo spec** (giữ nguyên alpha) — giải quyết đồng thời cả lỗi nền LẪN lỗi màu không đồng nhất trong 1 lần xử lý, vì màu AI vẽ ra không đồng nhất tuyệt đối giữa các icon dù cùng 1 mã màu yêu cầu.
4. Resize về đúng kích thước hiển thị (LANCZOS) → lưu RGBA PNG vào `pics/matted/`.

Kiểm tra offline trước khi đụng vào HTML: dựng contact-sheet (12 icon lên đúng nền thật của từng nút) + composite 3 icon mẫu lên nền đỏ chói (kiểm tra alpha thật, không phải trùng màu may rủi) — cả 2 đều cho kết quả sạch trước khi nhúng.

Nhúng lại bằng script `.scratch/apply_v3_icons.py` (thay base64 theo marker duy nhất, tự kiểm tra số lần khớp trước khi ghi file — không ghi nếu có lỗi): **13/13 vị trí OK** (1 tab-icon + 8 btn-icon tĩnh + 4 hằng số JS `ICON_STARTREST`/`FAV_ICON_ON`/`FAV_ICON_OFF`/`COPY_PREV_ICON`).

*Lỗi gặp khi viết script:* lần chạy đầu áp nhầm cách tìm chuỗi base64 của 4 hằng số JS (các biến này chỉ lưu base64 thuần, KHÔNG có tiền tố `data:image/png;base64,` — tiền tố được nối riêng lúc dùng trong JS) → script tìm sai vị trí, cách xa marker gần 95.000 ký tự. Vì file chỉ ghi khi 0 lỗi nên chưa từng ghi sai xuống đĩa; sửa lại hàm trích xuất riêng cho 4 biến này (lấy thẳng nội dung giữa `var X = "` và `";` kế tiếp, không tìm `base64,`) rồi chạy lại — 13/13 OK.

## Phần 3 — Fix lỗi #1: icon nút chức năng +75%

`.btn-icon`: `width/height` 20px → **35px** (`vertical-align` -5px → -11px, `margin-right` 8px → 10px, chỉnh theo tỉ lệ để icon vẫn căn giữa đúng dòng chữ).

## Phần 4 — Fix lỗi #3: đồng hồ đếm ngược +20%

`.ring` 150px → **180px**, `.ring::after` (viền trong) 9px → 11px (giữ tỉ lệ độ dày viền không đổi), `.ring .val` (số) 32px → **38px**, `.ring .unit` (chữ phụ) 15px → **18px**.

## Phần 5 — Fix lỗi #4: nút sửa (✎) / xoá (🗑) dễ bấm nhầm

Trước: `font-size:16px`, `padding:4px 6px`, khoảng cách giữa 2 nút chỉ 2px → vùng chạm thật ~24px, dưới chuẩn tối thiểu 44px (Apple HIG), và 2 nút quá sát nhau.

Sửa: tạo class dùng chung `.row-action-btn` (`font-size:22px`, `padding:10px` → vùng chạm ~42px, `border-radius:10px`, nền sáng khi bấm `:active` để có phản hồi rõ nút nào đang được chạm) và tăng khoảng cách 2 nút từ 2px → **10px**. Áp dụng cho cả 3 vị trí đang lặp code inline giống nhau (Nhập set / Lịch sử tập / Lịch sử Cơ thể) — gộp về 1 class chung để dễ bảo trì, vẫn giữ class riêng (`log-set-edit-btn`, `edit-set-btn`, `body-edit-btn`...) song song để không phá các đoạn JS đang dùng `querySelectorAll` theo class riêng đó.

## Phần 6 — Giả lập lỗi chức năng (bắt buộc theo yêu cầu, test thật qua Claude Preview MCP)

| # | Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|---|
| 1 | Bấm liên tiếp thật nhanh 2 lần vào nút 🗑 (race condition) | Không mở 2 modal xác nhận chồng nhau, không xoá 2 lần | PASS — `overlay.children.length` vẫn =1 sau 2 click liền; xác nhận 1 lần → số set giảm đúng 1 (2→1), không giảm 2 |
| 2 | Trong lúc modal xác nhận xoá đang mở, thử "chạm" (toạ độ thật, `elementFromPoint`) vào nút ✎ ngay bên dưới | Modal overlay phải chặn hoàn toàn thao tác chạm xuyên xuống nút bên dưới | PASS — `elementFromPoint` tại đúng toạ độ nút ✎ trả về `#appModalOverlay` (z-index 1000, pointer-events:auto), không phải nút ✎ |
| 3 | Focus bằng bàn phím (accessibility) vào nút `.row-action-btn` | Phải là phần tử `<button>` thật, `tabIndex=0`, `disabled=false` để hỗ trợ Tab/Enter/Space theo chuẩn | PASS |
| 4 | Đồng hồ đếm ngược ở các giá trị biên ("00:00", "59:59", "-0:01", "9:59") với font 38px mới | Chữ số không tràn ra ngoài vòng tròn | PASS — ô hiển thị số là khối cố định 180px căn giữa, không phụ thuộc độ dài chuỗi, không tràn ở mọi trường hợp |
| 5 | Ảnh đại diện bài tập lỗi tải (đường dẫn không tồn tại) — kiểm tra `onerror` fallback còn nguyên sau khi sửa icon khác | Tự chuyển sang `FALLBACK_THUMB_SRC`, không lặp vô hạn | PASS — thuộc tính `onerror="this.onerror=null;this.src=FALLBACK_THUMB_SRC;"` không đổi, không bị các thay đổi icon lần này ảnh hưởng |

## Phần 7 — Giả lập lỗi hình ảnh (bắt buộc theo yêu cầu) — **phát hiện thêm 1 lỗi thật + đã sửa**

| # | Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|---|
| 1 | Vẽ icon lên canvas nền đỏ chói (`#ff0000`) ở đúng kích thước hiển thị thật 35px cho cả 8 btn-icon, lấy mẫu pixel tại 4 góc | 4 góc phải là đỏ thuần (0 vệt nền cũ còn sót) | PASS — cả 8 icon, cả 2 góc kiểm tra đều `[255,0,0,255]` tuyệt đối |
| 2 | Kiểm tra viền/vệt màu lạ (fringing) — quét 1 hàng pixel ngang qua icon `btnLogSet` vẽ trên đúng nền thật (`#121214`), kiểm tra mọi pixel có nằm đúng trên đường pha trộn tuyến tính giữa màu nền và màu tiền cảnh chuẩn hay không | 0 pixel lệch khỏi đường pha trộn (không còn màu đen/xanh cũ sót lại ở viền) | PASS — 0/35 pixel bất thường |
| 3 | Thu nhỏ viewport xuống 320px (điện thoại màn nhỏ) — kiểm tra icon có bị lệch tâm khi nhãn nút dài phải xuống 2 dòng | Icon phải luôn căn giữa theo chiều dọc so với toàn bộ nội dung nút, kể cả khi chữ xuống dòng | **FAIL lần đầu** → phát hiện lỗi thật (xem bên dưới) → **PASS sau khi sửa** |

### Lỗi thật phát hiện qua kịch bản #3 (ngoài 4 lỗi user báo)

Ở màn hình 320px, 2 nút nhãn dài "Sao lưu lên Google Sheets" / "Khôi phục từ Google Sheets" bị xuống 2 dòng chữ. Vì `.btn` cũ dùng `display:block` + icon có `vertical-align` (bám theo dòng đầu tiên), icon bị **lệch khỏi tâm nút tới 9px** khi nhãn xuống 2 dòng — icon 75% to hơn càng khiến độ lệch dễ nhận ra hơn trước. Đây chính là kiểu lỗi hình ảnh mà bước giả lập được yêu cầu để tìm ra.

**Sửa:** đổi `.btn{display:block}` → `display:flex; align-items:center; justify-content:center` (giữ `text-align:center` cho các dòng chữ con khi xuống dòng). Icon và khối chữ (kể cả khi chữ xuống 2 dòng) giờ nằm trong 1 hàng flex, `align-items:center` luôn căn icon đúng giữa theo chiều cao thật của nội dung, bất kể 1 hay nhiều dòng.

**Kiểm tra lại sau sửa:**
- `btnGSheetBackup`/`btnGSheetRestore` ở 320px: độ lệch tâm icon 0px (trước sửa: -9px).
- Toàn bộ 5 nút btn-icon còn lại ở màn "Lịch sử": độ lệch tâm 0px, không hồi quy.
- Nút thuần chữ không icon (`#btnResetRest` "↺ Đặt lại"): vẫn `display:flex; justify-content:center; text-align:center`, căn giữa đúng như trước (không đổi cảm quan).
- Console: 0 lỗi sau khi đổi CSS + reload.

## Phần 8 — Test luồng UI thật khác (không tính vào 2 nhóm giả lập lỗi trên, nhưng xác nhận không hồi quy)

| Khu vực | Kết quả |
|---|---|
| Nút ★/☆ yêu thích — bấm đổi qua lại | PASS — src ảnh đổi đúng giữa `FAV_ICON_ON`/`FAV_ICON_OFF`, không lỗi |
| Nút copy-prev-set (⧉) sau khi ghi 1 set thật | PASS — icon `COPY_PREV_ICON` hiện đúng, title đúng "Copy 8 reps / 25kg từ set trước" |
| Lịch sử Cơ thể — nút ✎/🗑 với dữ liệu thật (seed 1 bản ghi cân nặng) | PASS — vùng chạm 42×42px, gap 10px; ✎ load đúng ngày vào form; 🗑 mở đúng modal xác nhận, Cancel không xoá |
| Đồng hồ đếm ngược chạy thật (bấm "Bắt đầu nghỉ", đợi vài giây) | PASS — số giảm dần đúng, không vỡ layout ở font 38px/vòng 180px |
| Modal sửa Reps (Nhập set) — mở rồi Cancel | PASS — không hồi quy sau khi refactor `.row-action-btn` |

## Kích thước file
`SoGym_A9_v2.html`: ~4.92MB → `SoGym_A9_v3.html`: **~4.77MB**. Giảm nhẹ dù thêm icon lớn hơn, vì 12 icon PNG RGBA đã tách nền/ép màu chuẩn (dải màu ít hơn hẳn ảnh AI vẽ gốc, nén PNG hiệu quả hơn) — vd icon `btnLogSet` cũ 35.960 ký tự base64 → mới 21.036 ký tự.

## Việc KHÔNG làm
Không đổi `DATA_SCHEMA_VERSION`. Không đổi SW. Không đổi icon/ảnh nào ngoài 12 icon overlay thuộc phạm vi báo lỗi (8 mascot + `fallback_exercise_thumb` giữ nguyên, đúng như spec đã xác nhận là ảnh nền đặc chủ đích, không phải icon overlay cần tách nền). Không đổi cơ chế cache ảnh bài tập.

## Chờ xác nhận từ user
Đã hoàn tất sửa 4 lỗi user báo + phát hiện và sửa thêm 1 lỗi hình ảnh thật qua bước giả lập bắt buộc (icon lệch tâm khi nhãn nút dài xuống 2 dòng ở màn hình hẹp). **Chưa push** — cần user xác nhận trước khi thay `SoGym_A9_v2.html` đang live bằng `SoGym_A9_v3.html`.
