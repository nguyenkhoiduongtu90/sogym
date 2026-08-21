# SoGym_A4_5_v9 — QA Report

**File:** `SoGym_A4_5_v9.html` (copied from `SoGym_A4_5_v8.html`, v8 archived to `_old_versions/`).
**Yêu cầu:** giả lập 3-5 tình huống lỗi cùng lớp với addCustomCard (v7) / picker-selection (v8) — "form/state dang dở không có Hủy + không tự reset khi chuyển tab" — ở 3 tab còn lại (Hôm nay, Nhập set, Lịch sử), sửa nếu có.

## Kết quả rà soát (5 tình huống)
| # | Tình huống | Kết quả |
|---|---|---|
| 1 | Tab Hôm nay — mở form "Thêm Cardio" (`#cardioForm`), gõ dở, chuyển tab khác rồi quay lại | **CÓ LỖI** — form kẹt mở nguyên, dữ liệu gõ dở còn nguyên (giống hệt bug addCustomCard ở v7) |
| 2 | Tab Hôm nay — mở form Cardio, ở lại tab, đổi ý không muốn thêm | **CÓ LỖI** — chỉ có nút "Lưu Cardio", không có nút Hủy |
| 3 | Tab Nhập set — gõ dở reps/kg (chưa bấm "Ghi nhận set"), chuyển tab khác rồi quay lại | Không lỗi — input giữ nguyên giá trị đã gõ (DOM không bị hủy khi rời tab), đúng như mong đợi, không gây trạng thái "kẹt/khó hiểu" |
| 4 | Tab Nhập set — đồng hồ nghỉ (rest timer) đang chạy, chuyển tab khác rồi quay lại | Không lỗi — timer tiếp tục chạy đúng nền, đúng hành vi mong muốn (không phải form dang dở) |
| 5 | Tab Lịch sử — các ô ngày xuất báo cáo / nút khôi phục file | Không áp dụng — không có form ẩn/hiện dạng toggle, luôn hiển thị sẵn |

→ Chỉ có 1 lỗi thật: **form "Thêm Cardio" ở tab Hôm nay**, đúng cùng lớp lỗi đã thống nhất hướng xử lý ở v7/v8.

## Fix (theo đúng phương án đã thống nhất)
- Thêm nút **"Hủy"** cạnh nút "Lưu Cardio".
- Hàm dùng chung `closeCardioForm()`: ẩn form, xóa trắng 4 ô nhập, xóa viền đỏ báo lỗi nếu có, đóng gợi ý loại hình.
- Gọi từ: nút Hủy, nút "+" khi bấm lại để đóng, sau khi lưu thành công, và tự động trong `switchScreen()` khi rời tab Hôm nay lúc form đang mở.

## Real-browser tests (all PASS)
| Test | Result |
|---|---|
| Mở form → Hủy | đóng đúng, 2 ô đã gõ về rỗng |
| Mở form → gõ dở → chuyển tab Lịch sử → quay lại Hôm nay | form tự đóng, dữ liệu gõ dở mất (lỗi gốc đã hết) |
| Bấm lại nút "+" để đóng (không dùng Hủy) | vẫn đóng đúng như cũ |
| Luồng Lưu Cardio đầy đủ | lưu đúng, `sessionCardio` +1, form tự đóng |
| Regression: form "Thêm bài tập mới" (v7) + picker-selection (v8) qua chuyển tab | vẫn tự reset đúng, không bị v9 ảnh hưởng |
| Splash ẩn đúng (regression v5) | class `hide` gắn đúng |
| Console errors trong toàn bộ quá trình test | không có |

## Status
Đã test thật đầy đủ, PASS toàn bộ, không có regression. Chờ user xác nhận **"A4.5_v9 OK"**.
