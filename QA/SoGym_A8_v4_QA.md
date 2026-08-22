# QA — SoGym_A8_v4.html — Đồng bộ ngưỡng Mục tiêu + gọn bớt chữ diễn giải

**Ngày:** 2026-08-22
**File:** `SoGym_A8_v4.html` (copy từ `SoGym_A8_v3.html`, file gốc không sửa — v3 đã báo cáo cho user nên không được edit in-place theo quy tắc dự án)
**SW:** không đổi, vẫn `SW_A7_v2.js`
**Trạng thái:** Đã sửa theo phản hồi user (sau khi báo cáo v3, trước khi kịp push), test thật kỹ, PENDING xin phép push GitHub.

## Bối cảnh
Sau khi báo cáo 4 fix của v3, user gửi thêm 3 việc trong cùng 1 tin nhắn, trước khi v3 kịp push:
1. Card "Mục tiêu" (cân nặng/%mỡ/%cơ/calo) nên có ngưỡng hợp lý giống hệt form "Nhập chỉ số theo ngày".
2. Cân nhắc bớt chữ/nội dung diễn giải trên màn hình nhỏ (điện thoại) để đỡ rối.
3. Push (bản mới nhất) lên GitHub để test bằng iPhone.

Vì việc #1 là 1 lỗi/thiếu-sót cụ thể (không phải chỉ là feedback test), quyết định gộp fix #1 + #2 thành `SoGym_A8_v4.html` rồi mới push — thay vì push nguyên `SoGym_A8_v3.html` như tên gọi trong tin nhắn trước, để tránh user vừa test xong lại phải chờ thêm 1 vòng nữa cho đúng cùng vấn đề vừa nêu.

## Điều tra trước khi sửa
Đọc lại `renderGoalGrid()`: khi đặt mục tiêu qua `prompt()`, code cũ chỉ chặn `val<0` (không âm) — KHÔNG có trần trên, nên có thể đặt mục tiêu cân nặng "999kg" trong khi form nhập chỉ số bên trên lại chặn ở 150kg — đúng như user chỉ ra, xác nhận đây là thiếu sót thật, không phải hiểu lầm.

## Sửa trong SoGym_A8_v4.html

### 1. Đồng bộ ngưỡng Mục tiêu với ngưỡng nhập chỉ số
Thay vì thêm 1 bộ số riêng cho `renderGoalGrid()` (rủi ro lệch số về sau, như đã từng gặp ở A5_v2), gộp về **1 object dùng chung** `BODY_SANITY_BOUNDS` (cân nặng >0 và ≤150kg, %mỡ/%cơ 0–50%, calo 0–10000kcal — đúng số đã chốt ở A8_v2) + hàm `checkBodyBound(type, val)`. Cả `btnSaveBody` (form nhập chỉ số) lẫn nút đặt mục tiêu trong `renderGoalGrid()` giờ đọc từ cùng 1 nguồn — sửa 1 chỗ là tự động đồng bộ cả 2, không thể lệch nhau nữa.

### 2. Gọn bớt chữ diễn giải (tab Cơ thể)
| Vị trí | Trước | Sau |
|---|---|---|
| Đoạn giới thiệu form nhập | "Nhập ít nhất 1 chỉ số — để trống ô nào thì ô đó không được lưu/cập nhật. Có thể chọn ngày trong quá khứ để bổ sung/sửa dữ liệu ngày đó." | "Bỏ trống ô nào thì ô đó không lưu. Chọn được cả ngày quá khứ." |
| Nhãn ô Ghi chú | "Ghi chú (không bắt buộc, tối đa 100 ký tự)" | "Ghi chú (tối đa 100 ký tự)" |
| Tiêu đề card Mục tiêu | "🎯 Mục tiêu (bấm vào ô để đặt/sửa)" | "🎯 Mục tiêu (bấm để sửa)" |
| Hint biểu đồ trống | "Cần ít nhất 2 ngày có số liệu của chỉ số này để vẽ được biểu đồ." | "Cần ≥2 ngày dữ liệu để vẽ biểu đồ." |

Chỉ rút gọn câu chữ, không bỏ thông tin cốt lõi (giới hạn ký tự, điều kiện vẽ biểu đồ vẫn còn). Đây là lựa chọn chủ quan của assistant dựa trên yêu cầu "bớt chữ" của user — nếu chưa đúng ý, có thể điều chỉnh thêm.

## Test thật (Claude Preview MCP)

### Đồng bộ ngưỡng Mục tiêu
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| `checkBodyBound()` cho từng loại tại đúng biên (150kg/50%/50%/10000kcal) | true | PASS |
| `checkBodyBound()` vượt biên nhẹ (150.1kg/50.1%/10001kcal) | false | PASS |
| Đặt mục tiêu cân nặng = 999 qua nút Mục tiêu (mô phỏng `prompt()` trả "999") | Bị chặn, alert đúng khoảng cho phép, không lưu | PASS |
| Đặt mục tiêu cân nặng = 150 (đúng biên) | Chấp nhận, lưu đúng | PASS |

### Gọn chữ diễn giải
| Kiểm tra | Kết quả |
|---|---|
| Đọc đúng nội dung mới của cả 4 vị trí qua DOM (`textContent`) | PASS — khớp đúng bảng trên |
| Ảnh chụp màn hình mobile 375×812 | Xác nhận layout gọn hơn, không mất thông tin quan trọng |

### Hồi quy (đảm bảo không phá gì đã có ở A8_v3)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Biên inclusive ở form nhập (150kg/50%/50%/10000kcal + ghi chú 100 ký tự) | Chấp nhận, lưu đúng | PASS |
| Lỗi "hint kẹt" (fix ở v3) | Không tái phát — rỗng thì hiện hint, sau đó nhập vượt ngưỡng thì hint tắt, chỉ còn viền đỏ | PASS |
| `buildExportSheets()` + `exportXlsx()` thật | Chạy đúng, không lỗi | PASS |
| **0 console error** trong suốt phiên test | Đúng | PASS |

Dữ liệu test dùng các ngày giả lập riêng (`2026-01-03`, `2026-01-04`), đã dọn sạch sau khi test.

## Việc KHÔNG làm
Không đổi SW. Không đổi data model/`DATA_SCHEMA_VERSION` (vẫn 3). Không đổi giá trị ngưỡng (vẫn 150kg/50%/50%/10000kcal/100 ký tự — chỉ đồng bộ nơi áp dụng, không đổi số). Không rút gọn `bodySaveHint` và `bodyHistoryEmptyHint` (đã đủ ngắn, và chỉ hiện có điều kiện nên không gây rối thường trực).

## Cần user xác nhận
1. Test thật trên iPhone: đặt mục tiêu cân nặng/%mỡ/%cơ/calo vượt ngưỡng — xem có bị chặn đúng như form nhập chỉ số không.
2. Xem cách rút gọn chữ ở 4 vị trí trên có ổn không, hay cần rút gọn thêm/khác đi.
3. Xác nhận cho push lên GitHub (SW không đổi, không cần bump) — bản sẽ thay thế `SoGym_A8_v2.html` đang live.
