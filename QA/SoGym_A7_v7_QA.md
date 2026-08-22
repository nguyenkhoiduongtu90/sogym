# QA — SoGym_A7_v7.html — Fix lần 3 lỗi "Xóa toàn bộ dữ liệu" (bỏ hẳn yêu cầu gõ đúng dấu)

**Ngày:** 2026-08-22
**File:** `SoGym_A7_v7.html` (copy từ `SoGym_A7_v6.html`, chỉ sửa đúng 1 hàm `resetAllData()` + `<title>` + comment changelog)
**SW:** không đổi, vẫn `SW_A7_v2.js`
**Trạng thái:** Đã fix + test thật kỹ, PENDING xin phép push GitHub.

## Báo cáo của user
User test lại URL live `SoGym_A7_v6.html` trên điện thoại thật (kèm ảnh chụp màn hình), vẫn thấy đúng alert "Xác nhận không đúng — đã hủy thao tác, dữ liệu KHÔNG bị thay đổi." — **đây là lần thứ 3 liên tiếp** cùng 1 triệu chứng tái diễn (sau A7_v5 fix NFC/NFD, A7_v6 fix hoa/thường).

## Loại trừ lại khả năng deploy/cache sai (như 2 lần trước)
Không giả định — kiểm tra lại: tải file live `SoGym_A7_v6.html` bằng `curl`, xác nhận có mặt cả 2 đoạn fix cũ (`normalizeConfirmText`, `.toUpperCase()`). Bản live đúng là bản đã có đủ 2 fix trước — bug thật sự nằm ở chỗ 2 fix đó vẫn CHƯA đủ, không phải do deploy/cache.

## Đánh giá lại chiến lược
Sau 3 lần thất bại liên tiếp với 3 nguyên nhân input khác nhau (NFC/NFD, hoa/thường, và giờ nhiều khả năng là sai/thiếu dấu thanh), kết luận: **yêu cầu user phải gõ ĐÚNG DẤU tiếng Việt "XÓA" qua bàn phím di động tự nó là điểm không đáng tin cậy**, vì:
- Bàn phím iOS hiện popup chọn dấu khi giữ phím "o" (ò ó ô õ...) — dễ chạm nhầm dấu, đặc biệt trong hộp thoại `prompt()` nhỏ, thao tác nhanh.
- Đã 2 lần fix trước mỗi lần chỉ xử lý được 1 lớp nguyên nhân, mỗi lần lại lộ ra nguyên nhân khác — không nên tiếp tục đoán nguyên nhân thứ 4 một cách rời rạc.

**Quyết định:** bỏ HẲN yêu cầu gõ đúng dấu thanh — chỉ còn yêu cầu gõ đúng 3 CHỮ CÁI GỐC "XOA" theo đúng thứ tự (không phân biệt hoa/thường, có dấu hay không đều được). Vẫn giữ đủ 2 lớp xác nhận (`confirm()` cảnh báo hậu quả + `prompt()` gõ chữ) — mức bảo vệ chống bấm nhầm không đổi, chỉ bỏ đúng phần đã chứng minh không đáng tin cậy qua 3 lần thử thật.

## Fix áp dụng trong SoGym_A7_v7.html
Trong `resetAllData()`, hàm `normalizeConfirmText(s)` đổi từ tự viết `.normalize('NFC').toUpperCase()` sang **tái dùng `normalizeVi()`** — hàm đã có sẵn trong chính app này (dùng cho tìm kiếm bỏ dấu ở tab Chọn bài, đã hoạt động đúng từ trước), thực hiện NFD + xoá mọi dấu kết hợp + xử lý riêng đ/Đ + lowercase. Lý do tái dùng thay vì viết hàm mới: đây là logic đã được chứng minh đúng trong chính codebase, giảm rủi ro tự viết thêm 1 hàm chuẩn hoá khác lại sót 1 trường hợp Unicode nào đó chưa lường trước (bài học rút ra sau 2 lần fix riêng lẻ trước). Đổi câu nhắc `prompt()` thành "...(không phân biệt hoa/thường, có dấu hay không đều được)".

## Test lại (real, gọi trực tiếp hàm `resetAllData()` thật qua Claude Preview)

**Test 1 — 14 trường hợp gõ:**
| Trường hợp | Kỳ vọng | Kết quả |
|---|---|---|
| `XÓA` (NFC/NFD, đúng dấu) | Chấp nhận | PASS |
| `Xóa`, `xóa` (đổi hoa/thường, đúng dấu) | Chấp nhận | PASS |
| `XOA`, `xoa`, `Xoa` (không dấu, mọi kiểu hoa/thường) | Chấp nhận (fix chính lần này) | PASS |
| `XÒA` (dấu huyền — mô phỏng chạm nhầm dấu), `xõa` (dấu ngã) | Chấp nhận (fix chính lần này) | PASS |
| Khoảng trắng đầu/cuối, zero-width space đầu | Chấp nhận | PASS |
| `DELETE`, `OXA` (đúng chữ cái nhưng sai thứ tự), chuỗi rỗng | **Từ chối** (không nới lỏng quá đà) | PASS |

12/12 biến thể hợp lệ được chấp nhận (bao phủ toàn bộ 3 lớp nguyên nhân đã gặp: NFC/NFD, hoa/thường, sai/thiếu dấu), 3/3 biến thể thật sự sai vẫn bị từ chối đúng.

**Test 2 — hồi quy 2 luồng huỷ:** Huỷ ở `confirm()` đầu (prompt không được gọi) và Huỷ ở `prompt()` (typed=null) — cả 2 đều không alert, không xoá, đúng như thiết kế cũ. PASS.

**Test 3 — console:** 0 lỗi.

## Giới hạn đã biết
Vẫn chưa test được bằng thao tác gõ tay thật trên bàn phím iOS/Android thật (không có thiết bị). Đã test bằng cách mô phỏng trực tiếp mọi biến thể chuỗi ký tự có thể phát sinh từ 3 lớp nguyên nhân đã xác nhận thật (không phải chỉ đọc code), chạy thẳng vào hàm thật `resetAllData()`.

## Việc KHÔNG làm
Không đổi SW. Không đổi hàm nào khác ngoài `resetAllData()`. Không bỏ 2 lớp xác nhận confirm()+prompt() — chỉ bỏ yêu cầu gõ đúng dấu thanh trong lớp thứ 2.

## ⚠️ Cần user xác nhận lại trên thiết bị thật (sau khi push GitHub Pages)
1. Vào tab Lịch sử, bấm "🗑 Xóa toàn bộ dữ liệu" → xác nhận cảnh báo → gõ "XOA" theo cách TỰ NHIÊN NHẤT có thể (không cố ý bật Caps, không cố ý gõ đúng dấu — cứ gõ như phản xạ bình thường) → phải xoá được.
2. Nếu VẪN còn lỗi ở lần này, cần chụp lại đúng chữ đã gõ hiện lên (nếu bàn phím có hiện preview) hoặc mô tả cụ thể cách gõ để xác định chính xác nguyên nhân thay vì tiếp tục đoán.
