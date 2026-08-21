# SoGym_A4_6_v1 — QA Report

**File:** `SoGym_A4_6_v1.html` (copied từ `SoGym_A4_5_v9.html`, v9 archived to `_old_versions/`).
**Fix:** chip lọc thiết bị "Máy Smith" ở màn Chọn bài luôn ra "Không tìm thấy bài phù hợp" (0 kết quả), phát hiện ở A4.6 QA sweep.

## Root cause
20 bài có tên tiếng Anh chứa "Smith" bị gán sai `equipGroup` từ bước mapping dữ liệu gốc A4.1/A4.2:
- 19 bài → `"Máy chuyên biệt"`
- 1 bài (`Smith_Incline_Shoulder_Raise`) → `"Không cần máy"`
- Đáng lẽ cả 20 phải là `"Máy Smith"`.

Đã đối chiếu chéo, xác nhận lỗi chỉ giới hạn ở nhóm Máy Smith ("Cable"→"Máy cáp" và "Machine"→"Máy chuyên biệt" đều 0 sai lệch).

## Fix
- Sửa `equipGroup` của đúng 20 ID sau thành `"Máy Smith"`: `Decline_Smith_Press`, `Smith_Incline_Shoulder_Raise`, `Smith_Machine_Behind_the_Back_Shrug`, `Smith_Machine_Bench_Press`, `Smith_Machine_Bent_Over_Row`, `Smith_Machine_Calf_Raise`, `Smith_Machine_Close-Grip_Bench_Press`, `Smith_Machine_Decline_Press`, `Smith_Machine_Hang_Power_Clean`, `Smith_Machine_Hip_Raise`, `Smith_Machine_Incline_Bench_Press`, `Smith_Machine_Leg_Press`, `Smith_Machine_One-Arm_Upright_Row`, `Smith_Machine_Overhead_Shoulder_Press`, `Smith_Machine_Pistol_Squat`, `Smith_Machine_Reverse_Calf_Raises`, `Smith_Machine_Squat`, `Smith_Machine_Stiff-Legged_Deadlift`, `Smith_Machine_Upright_Row`, `Smith_Single-Leg_Split_Squat`.
- Áp dụng bằng regex Python scoped theo từng ID cụ thể (neo vào `"id":"<ID>"` rồi thay đúng `"equipGroup":"..."` gần nhất ngay sau đó), tránh sửa nhầm bài khác — verify từng bước bằng cách parse lại catalog JSON sau khi sửa.
- **Phát hiện thêm trong lúc test:** sau khi sửa `equipGroup`, field `equipDetail` của 20 bài này vẫn còn giá trị cũ (`"Máy chuyên biệt"` hoặc `"Tạ đòn"`), khiến UI hiển thị nhãn thiết bị mâu thuẫn `"Máy Smith — Máy chuyên biệt"`. Đối chiếu quy ước hiện có của app (nhóm "Máy cáp"/"Máy chuyên biệt" đều có `equipDetail` = trùng với `equipGroup`, không có mô tả chi tiết hơn), đã sửa luôn `equipDetail` của cùng 20 bài thành `"Máy Smith"` để nhất quán — đây là hoàn thiện đúng phạm vi sửa đã được duyệt (cùng 1 lỗi, cùng 20 bài), không phải mở rộng phạm vi mới.

## Real-browser tests (all PASS)
| Test | Result |
|---|---|
| Tổng số bài sau khi sửa | vẫn đúng 873, không trùng/không mất ID nào |
| Phân bố `equipGroup` sau khi sửa | Không cần máy: 724, Máy chuyên biệt: 48, Máy cáp: 81, Máy Smith: 20 (tổng = 873) |
| Chip "Máy Smith" ở màn Chọn bài | ra đúng 20 kết quả (trước đây 0) |
| 3 chip còn lại (Không cần máy / Máy chuyên biệt / Máy cáp) | không đổi số liệu ngoài phần đã chuyển đi (regression OK) |
| Lọc kết hợp chip "Máy Smith" + nhóm cơ (vd "Ngực dưới") | ra đúng 2/2 bài khớp thủ công |
| Tìm kiếm "smith machine squat" | ra đúng 2 bài liên quan |
| Nhãn thiết bị hiển thị (`resolvedEquipmentDisplay`) cho bài Máy Smith | `"Máy Smith — Máy Smith"` — nhất quán với quy ước hiện có của các nhóm máy khác (vd "Máy chuyên biệt — Máy chuyên biệt"), không phải lỗi mới |
| Chọn 1 bài Máy Smith (`Smith_Machine_Squat`) → Thêm vào buổi tập | thêm đúng vào `sessionExercises`, chuyển đúng sang tab Hôm nay, `pickerSelectedId` reset đúng |
| Splash ẩn đúng (regression v5) | class `hide` gắn đúng |
| Console errors trong toàn bộ quá trình test | không có |

## Chưa xử lý trong version này
Phát hiện còn lại từ A4.6 QA sweep — field `force` rỗng ở 389/873 bài — **cố ý chưa đụng tới**, chờ quyết định riêng của người dùng (cần hướng xử lý khác: thêm giá trị "Khác" + phân loại chọn lọc, không phải điền đại trà).

## Status
Đã test thật đầy đủ, PASS toàn bộ, không có regression. Chờ user xác nhận **"A4.6_v1 OK"**.
