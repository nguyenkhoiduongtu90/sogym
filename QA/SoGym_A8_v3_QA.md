# QA — SoGym_A8_v3.html — Sửa 4 lỗi user báo cáo sau khi test A8_v2 trên điện thoại thật

**Ngày:** 2026-08-22
**File:** `SoGym_A8_v3.html` (copy từ `SoGym_A8_v2.html`, file gốc không sửa — v2 đã báo cáo + push GitHub cho user nên không được edit in-place theo quy tắc dự án)
**SW:** không đổi, vẫn `SW_A7_v2.js`
**Trạng thái:** Đã sửa cả 4 điểm user báo cáo, test thật kỹ (bao gồm giả lập 3 kịch bản sai phạm theo đúng yêu cầu), PENDING xin phép push GitHub.

## Báo cáo của user (sau khi test A8_v2 thật trên điện thoại)
Nhắn tin xác nhận 3 việc OK (nút ✎ mở lại form, nhập hôm nay, giá trị đúng biên/vượt biên) và báo 4 lỗi mới:
1. Nút chọn ngày dài nên đè vào nút "Hôm nay", lỗi hiển thị.
2. Khi nhập số vượt giới hạn (cân nặng/calo/%mỡ/%cơ) rồi bấm "Lưu chỉ số", lại hiện cảnh báo "Cần nhập ít nhất 1 chỉ số hoặc ghi chú để lưu" — sai thông báo so với lỗi thật. Yêu cầu giả lập 2-3 tình huống sai phạm để test và sửa.
3. Calo nạp nên có dấu "." phân hàng ngàn cho dễ nhìn.
4. Ghi chú chưa có giới hạn ký tự — cần thêm để tiết kiệm dung lượng bộ nhớ.

## Điều tra nguyên nhân (trước khi sửa, đúng quy tắc không đoán mà kiểm tra)

### Lỗi 2 — nguyên nhân gốc (RCA)
Đọc lại code `btnSaveBody`: khi 1 field vượt ngưỡng, code set viền đỏ rồi `return` NGAY (dòng chặn theo biên hợp lý), trước khi chạy tới dòng `hint.style.display = 'none'` ở cuối. Nếu người dùng từng bấm Lưu lúc để trống hết (hint hiện `block`) rồi lần sau nhập số vượt ngưỡng, hint CŨ bị "kẹt" hiển thị `block` vì không có đường code nào tắt nó trong nhánh vượt-biên. Đã tái hiện thật bằng Claude Preview (không chỉ đọc code): bấm Lưu form rỗng → hint "block" → nhập cân nặng 200 (vượt 150) → bấm Lưu → xác nhận hint đúng là vẫn "block" dù lỗi thật đã đổi sang vượt biên. Xác nhận đúng root cause trước khi sửa.

## Sửa trong SoGym_A8_v3.html

### 1. Layout ô ngày + nút "Hôm nay" (đè nhau trên điện thoại)
Đổi container từ `display:flex` (không cho co giãn dưới kích thước nội dung do flex-item mặc định `min-width:auto`) sang thêm `flex-wrap:wrap`, `min-width:0` cho ô ngày, `flex-shrink:0` cho nút. Kết quả: nếu đủ chỗ, 2 phần tử nằm cùng hàng như cũ; nếu widget ngày của trình duyệt/hệ điều hành rộng hơn dự kiến (khác nhau giữa Chromium PC và Safari iOS — đúng nguyên nhân treo lỗi), tự động xuống hàng thay vì đè lên nhau — đảm bảo không bao giờ chồng lấn bất kể độ rộng ngày hiển thị của từng trình duyệt.

### 2. Thông báo sai khi vượt ngưỡng (fix chính, đã xác nhận RCA ở trên)
Chuyển dòng `hint.style.display = 'none'` lên **đầu hàm** (chạy ngay khi bấm Lưu, trước mọi kiểm tra) thay vì chỉ ở nhánh thành công cuối cùng — đảm bảo mọi lần bấm Lưu đều xoá thông báo cũ trước, rồi mới tính lại đúng trạng thái hiện tại (chỉ hiện lại nếu đúng là trường hợp rỗng thật).

### 3. Định dạng calo có dấu "." phân hàng ngàn
Thêm hàm `fmtKcal(n)` dùng `n.toLocaleString('vi-VN')`, áp dụng cho: (a) hiển thị trong Lịch sử Cơ thể (vd "8.000 kcal"), (b) ô "hiện tại/mục tiêu" của calo trong card Mục tiêu. **Cố ý KHÔNG áp dụng** cho cân nặng/%mỡ/%cơ vì locale `vi-VN` đổi dấu thập phân từ "." sang "," — sẽ xung khắc với quy ước nhập liệu dấu "." hiện tại của các ô nhập số trong app (rủi ro gây nhầm lẫn nếu áp dụng đại trà).

### 4. Giới hạn ghi chú
Hỏi lại user qua AskUserQuestion (đúng quy tắc "không rõ hỏi lại trước khi thực hiện" vì đây là con số cần quyết định, không có tiền lệ trong app) — **user chọn 100 ký tự**. Áp dụng 2 lớp: `maxlength="100"` trên HTML input (chặn gõ tay/dán vượt quá) + kiểm tra lại phía JS (`note.length <= 100`, viền đỏ nếu vượt, không cho lưu) phòng trường hợp value bị set bằng cách khác (vd qua devtools) — theo đúng pattern "2 lớp chặn" đã dùng cho ngày tương lai ở A8_v2. Nhãn ô cũng cập nhật hiển thị rõ "tối đa 100 ký tự".

## Test thật (Claude Preview MCP, gọi trực tiếp hàm/click nút thật)

### Layout (lỗi 1)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Viewport 320×700 (điện thoại nhỏ nhất phổ biến) | Không đè nhau — tự xuống hàng nếu cần | PASS (ảnh chụp xác nhận: ô ngày và nút "Hôm nay" xuống 2 hàng riêng biệt, không chồng lấn) |
| Viewport 375×812 (mobile chuẩn) | Không đè nhau | PASS |

### Thông báo sai khi vượt ngưỡng (lỗi 2) — 3 kịch bản giả lập theo đúng yêu cầu user
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| A. Lưu form rỗng → sau đó nhập cân nặng 200 (vượt 150) → Lưu | Hint tắt hẳn ("none"), chỉ còn viền đỏ ở cân nặng, không lưu gì | PASS (trước khi sửa: hint bị kẹt "block" — đã tái hiện bug thật rồi xác nhận hết bug) |
| B. Cả 4 field cùng vượt ngưỡng 1 lúc (cân nặng 999, calo 99999, %mỡ 80, %cơ 80) | Cả 4 viền đỏ, hint không hiện, không lưu gì | PASS |
| C. Gõ chữ rác không parse được số vào cân nặng ("80kg") | Viền đỏ ở cân nặng, hint không hiện | PASS |

### Định dạng calo (lỗi 3)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Lưu calo = 8000, xem trong Lịch sử Cơ thể | Hiển thị "8.000 kcal" | PASS |
| Xem ô "hiện tại" của Calo/ngày trong card Mục tiêu | Hiển thị "8.000" (có dấu chấm) | PASS |

### Giới hạn ghi chú 100 ký tự (lỗi 4)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Thuộc tính `maxlength="100"` có trên input | Đúng | PASS |
| Set value 150 ký tự bằng JS (mô phỏng bypass maxlength) rồi Lưu | Viền đỏ ở ô ghi chú, không lưu | PASS |
| Ghi chú đúng 100 ký tự (biên inclusive) | Chấp nhận, lưu đúng | PASS |

### Hồi quy (đảm bảo không phá gì đã có ở A8_v2)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Biên hợp lý đúng ranh giới cũ (150kg/50%/50%/10000kcal, ghi chú 100 ký tự) cùng lúc | Chấp nhận hết, lưu đúng | PASS |
| Cả 5 tab chuyển màn hình qua `switchScreen()` | Sạch, không lỗi | PASS |
| `buildExportSheets()` thật — sheet "Cơ thể & Dinh dưỡng" | Đúng header 6 cột | PASS |
| `exportXlsx()` thật (không mock) | Chạy trọn vẹn không lỗi | PASS |
| **0 console error** trong suốt phiên test | Đúng | PASS |

Toàn bộ dữ liệu test dùng ngày giả lập riêng (`2026-01-01`, `2026-01-02`, không đụng dữ liệu thật của user) và đã dọn sạch (`state.body`/`state.nutrition` filter bỏ) trước khi kết thúc phiên test.

## Việc KHÔNG làm
Không đổi SW. Không đổi data model/`DATA_SCHEMA_VERSION` (vẫn 3). Không đổi ngưỡng hợp lý (vẫn 150kg/50%/50%/10000kcal, đã chốt ở A8_v2). Không định dạng dấu chấm cho cân nặng/%mỡ/%cơ (lý do xung khắc thập phân, giải thích ở trên). Không đổi cơ chế chọn ngày bất kỳ đã có ở A8_v2 (chỉ sửa CSS layout, không đổi logic).

## Cần user xác nhận
1. Test thật trên điện thoại: mở tab Cơ thể, kiểm tra ô ngày + nút "Hôm nay" không còn đè nhau nữa.
2. Thử nhập số vượt ngưỡng rồi bấm Lưu — xem đúng là chỉ còn viền đỏ, không còn hiện nhầm thông báo "cần nhập ít nhất 1 chỉ số" nữa.
3. Xem calo trong Lịch sử Cơ thể + Mục tiêu đã có dấu "." phân hàng ngàn.
4. Thử gõ ghi chú dài — xác nhận bị chặn ở 100 ký tự, thấy hợp lý không.
5. Xác nhận cho push lên GitHub (SW không đổi, không cần bump).
