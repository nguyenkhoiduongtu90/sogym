# SoGym_A4_5_v6 — QA Report

**File:** `SoGym_A4_5_v6.html` (copied from `SoGym_A4_5_v5.html`, unmodified).
**Feature:** new "★ Yêu thích" chip in màn Chọn bài's chip-row (`#chipRow`), mutually exclusive with the equipment chips (Tất cả/Không cần máy/Máy chuyên biệt/Máy cáp/Máy Smith).

## Behavior
- Search box trống + chip Yêu thích active → hiện toàn bộ bài đã đánh dấu yêu thích (isFavorite()).
- Search box có từ khóa + chip Yêu thích active → chỉ hiện các bài yêu thích trong số kết quả khớp từ khóa (giao của search + favorite).
- Khi chip Yêu thích active, bộ lọc thiết bị bị bỏ qua (coi như "tất cả thiết bị"); bộ lọc nhóm cơ (dropdown) vẫn áp dụng bình thường.
- Không có bài yêu thích nào khớp → thông báo riêng "Chưa có bài yêu thích nào — bấm ☆ ở bài bất kỳ để đánh dấu." (thay vì thông báo chung).
- Tái sử dụng nguyên `isFavorite()`/`computeHistoryUsageCounts()`, không thêm data model mới.

## Real-browser tests (all PASS)
| Test | Result |
|---|---|
| Chip Yêu thích, search trống | hiện đúng 3/3 bài đã yêu thích |
| Gõ "cable" + chip Yêu thích | hiện đúng 1 bài (giao đúng của search+favorite) |
| Xóa search, giữ chip Yêu thích | quay lại đúng 3 bài |
| Search không khớp bài yêu thích nào | "Không tìm thấy bài phù hợp." |
| Chuyển sang "Tất cả", search trống | quay lại placeholder gốc đúng như trước |
| Chip "Máy cáp" (thường) vẫn hoạt động đúng | 81 kết quả, không bị ảnh hưởng bởi tính năng mới |
| Chọn 1 bài trong danh sách lọc theo Yêu thích → nút "Thêm vào buổi tập" | hoạt động đúng |
| Bỏ sao 1 bài khi đang xem chip Yêu thích | icon đổi ☆ đúng tại chỗ, bài không biến mất khỏi danh sách ngay (đúng hành vi có sẵn từ v4 — chỉ áp dụng ở lần render sau) |
| Console errors trong toàn bộ quá trình test | không có |

## Status
Đã test thật đầy đủ, PASS toàn bộ, không có regression. Chờ user xác nhận **"A4.5_v6 OK"**. Các mục còn tồn đọng từ trước (chưa liên quan bản này): xác nhận thật trên iPhone cho navbar/rest-timer overlap (từ v3); chưa có version A4.5 nào nhận "OK" chính thức.
