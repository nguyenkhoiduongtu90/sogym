# SoGym_A4_5_v7 — QA Report

**File:** `SoGym_A4_5_v7.html` (copied from `SoGym_A4_5_v6.html`, v6 archived to `_old_versions/`).
**Bug fixed:** ở màn Chọn bài, form "Thêm bài tập mới" (`#addCustomCard`) không tắt được, không có nút Hủy.

## Root cause
1. Nút mở form (`#btnShowAddCustom`) chỉ toggle `display` khi bấm lại đúng nút đó — không có gợi ý hình ảnh nào cho biết bấm lại là để đóng, và không có nút Hủy/Đóng riêng.
2. Nghiêm trọng hơn: `switchScreen()` không có logic reset form này. Xác nhận bằng test thật: mở form, gõ "Test bài lỡ tay" vào ô tên, chuyển sang tab Home, quay lại Chọn bài → form vẫn mở, chữ đã gõ vẫn còn nguyên (bug tái hiện đúng như báo cáo).

## Fix
- Thêm hàm dùng chung `closeCustomExerciseForm()`: ẩn card, xóa trắng tên/nhóm cơ phụ/thiết bị, đóng danh sách gợi ý nếu đang mở.
- Thêm nút "Hủy" cạnh nút "Lưu bài tập mới".
- Nút toggle mở form giờ gọi `closeCustomExerciseForm()` khi đóng (thay vì set display trực tiếp).
- Nút Lưu (sau khi lưu thành công) gọi `closeCustomExerciseForm()` thay vì tự xóa từng trường.
- `switchScreen()`: nếu rời khỏi màn Chọn bài mà form đang mở → tự động gọi `closeCustomExerciseForm()`.

## Real-browser tests (all PASS)
| Test | Result |
|---|---|
| Mở form → bấm nút Hủy | `display:'none'`, ô tên rỗng |
| Mở form → gõ chữ → chuyển tab Home → quay lại Chọn bài | `display:'none'`, ô tên rỗng (bug gốc đã hết) |
| Mở form → bấm lại nút toggle (không dùng Hủy) | vẫn đóng đúng như cũ |
| Luồng Lưu bài tập mới đầy đủ (nhập tên + thiết bị → Lưu) | lưu đúng, `customExercises` +1, form tự đóng |
| Splash screen ẩn đúng sau khi tải (regression check cho fix v5) | class `hide` được gắn đúng |
| Console errors trong toàn bộ quá trình test | không có (chỉ có warning không liên quan về đọc localStorage do sandbox môi trường test, không phải lỗi app) |

## Status
Đã test thật đầy đủ, PASS toàn bộ, không có regression. Chờ user xác nhận **"A4.5_v7 OK"**.
