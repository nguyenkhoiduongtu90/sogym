# SoGym_A5_v1 — QA Report

**File:** `SoGym_A5_v1.html` (copied từ `SoGym_A4_6_v1.html`, confirmed baseline).
**Bước:** A5 — Workout Experience / History. 🎯 flagged → đã chạy đủ ritual mô phỏng lỗi trước khi báo cáo.

## Bối cảnh
Trước khi sửa code, đã dispatch 1 Explore agent audit lại toàn bộ khung session/timer/history đã build từ trước. Kết luận: framework đã hoàn thiện ~95% từ các bước nền tảng trước đó, chỉ có đúng 2 khoảng trống thật sự nằm trong phạm vi A5:
1. Set đã ghi trong buổi đang tập không có nút Sửa/Xóa (chỉ hiện text tĩnh).
2. Ở Lịch sử, chỉ sửa được giá trị 1 set hoặc xóa cả buổi — không xóa được riêng 1 set.

Cả 2 đã được duyệt qua `AskUserQuestion` trước khi implement ("Có, làm luôn (khuyến nghị)" cho cả hai).

## Fix

### 1. Sửa/Xóa 1 set trong buổi đang tập
- `renderSetRows()` (màn Nhập set): mỗi dòng set đã ghi giờ có thêm nút ✎ (Sửa) và 🗑 (Xóa), tái dùng đúng kiểu prompt-based edit đã có sẵn ở Lịch sử để nhất quán trải nghiệm.
- Sửa: 2 `prompt()` hỏi Reps rồi Tạ (kg), validate giống hệt `btnLogSet` (reps nguyên dương, tạ số dương), tính lại `rm` bằng công thức Epley, `saveState()` + render lại.
- Xóa: `confirm()` rồi `sets.splice(si,1)`, `saveState()` + render lại.
- Cả 2 đều gọi thêm `renderHome()` để đồng bộ số liệu hiển thị ở tab Hôm nay.

### 2. Xóa riêng 1 set trong Lịch sử
- `renderHistory()`: mỗi dòng set trong buổi đã lưu giờ có thêm nút 🗑 (`del-set-btn`) cạnh nút ✎ (`edit-set-btn`) đã có sẵn, cùng cơ chế `data-hi/data-ei/data-si` để định vị đúng set.
- Xóa: `confirm()` rồi `state.history[hi].exercises[ei].sets.splice(si,1)`, `saveState()` + `renderHistory()`.

Cả 2 chỗ đều dùng kỹ thuật vá file bằng Python (`str.replace` theo anchor duy nhất) do file có các dòng cực dài (catalog 873 bài, icon base64) khiến tool `Read`/`Edit` chuẩn bị bị chặn theo giới hạn token toàn file.

## Real-browser tests (Claude Preview MCP, server `sogym-static`, cổng 8934)

### Luồng bình thường
| Test | Kết quả |
|---|---|
| Log 3 set vào 1 bài trong buổi đang tập | Đúng, mỗi dòng hiện đủ 2 nút ✎/🗑 |
| Xóa set #2 (giữa danh sách) | Đúng — set biến mất, 2 set còn lại tự đánh lại số 1/2, `data-si` của các nút cập nhật đúng 0/1 (không bị lệch index cũ) |
| Sửa set #1 (10 reps/50kg → 12 reps/65kg) | Đúng — `rm` tính lại đúng = 91 (Epley), `setId` gốc được giữ nguyên (không bị cấp lại ID mới) |
| Kết thúc bài + kết thúc buổi → lưu vào Lịch sử | Đúng, dữ liệu set khớp với buổi đang tập |
| Lịch sử: mở rộng buổi, đếm nút ✎/🗑 | Đúng 2/2 mỗi loại, khớp số set |
| Xóa 1 set trong Lịch sử | Đúng — set biến mất khỏi đúng buổi/đúng bài, không ảnh hưởng set khác |
| Xóa cả buổi tập (`data-delsess`, chức năng cũ) | Vẫn hoạt động đúng — regression OK |

### Ritual mô phỏng lỗi (bắt buộc do A5 gắn 🎯)
| Kịch bản | Kết quả |
|---|---|
| Sửa set với reps âm (-5) | Bị từ chối đúng, hiện `alert` cảnh báo, dữ liệu KHÔNG đổi |
| Bấm Sửa rồi bấm Cancel ở hộp thoại prompt | Dữ liệu giữ nguyên, không có tác dụng phụ |
| Bấm Xóa rồi bấm Cancel ở hộp thoại confirm | Dữ liệu giữ nguyên |
| Xóa set giữa danh sách rồi kiểm tra `data-si` của các nút còn lại | Cập nhật đúng theo index mới sau re-render, không bị stale-index |
| Xóa hết toàn bộ set (về 0) trong buổi đang tập → hoàn thành bài → kết thúc buổi → Lịch sử hiển thị "Chưa ghi set nào" | Đúng, không crash |
| Gọi `buildExportSheets()` (xuất Excel) với 1 bài có 0 set trong Lịch sử | Không lỗi/crash, đủ 5 sheet |
| Lịch sử với bài có 0 set: đếm nút `.del-set-btn` | Đúng 0 (không tạo nút thừa cho danh sách rỗng) |
| Console errors trong toàn bộ quá trình test (luồng thường + ritual) | Không có |

## Chưa xử lý / không thuộc phạm vi A5_v1
- Việc phân loại `force` cho 389 bài (Excel handoff đã gửi trước đó) — vẫn đang chờ người dùng hoàn thành, không liên quan A5, không bị ảnh hưởng bởi bản này.
- Không có thay đổi nào tới session lifecycle, rest timer, export logic, hay bất kỳ phần nào khác của A5 đã hoạt động tốt trước đó.

## Status
Đã implement đủ 2 tính năng được duyệt, test thật đầy đủ (luồng thường + ritual 3-5 kịch bản lỗi bắt buộc), PASS toàn bộ, không có regression, 0 console error. Chờ user xác nhận **"A5_v1 OK"**.
