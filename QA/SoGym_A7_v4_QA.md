# QA — SoGym_A7_v4.html — 2 lỗi thực tế user báo: ảnh offline phải tải lại + nghi ngờ câu nhắc hết giờ không random

**Ngày:** 2026-08-21
**File:** `SoGym_A7_v4.html` (copy từ `SoGym_A7_v3.html`, chỉ đổi `<title>`, thêm comment A7_v4, đổi đường dẫn đăng ký Service Worker sang `SW_A7_v2.js`, thêm gọi `navigator.storage.persist()`, sửa 1 comment cũ nhắc tới `SW_A7_v1.js`)
**SW:** `SW_A7_v2.js` (copy từ `SW_A7_v1.js`, đổi đúng 1 hằng số: `IMAGE_CACHE_MAX_ENTRIES` 150 → 400 — không đổi thuật toán trim/touch LRU)
**Trạng thái:** PENDING — chờ user xác nhận lại trên thiết bị thật, đặc biệt là tình huống offline thật (máy bay/tắt wifi+data) sau khi đã lướt nhiều ảnh, vì đây là giới hạn không mô phỏng được đầy đủ trong sandbox test (xem mục "Giới hạn" bên dưới).

## Lý do đợt audit này
User báo 2 lỗi thực tế phát hiện được khi dùng app (nguyên văn):
> "tôi có một số lỗi thực tế tôi tìm được như sau: * nếu không có internet thì sao những hình ảnh ở tab chọn bài đã load thành công trước đó, chúng ta không lư lại luôn mà mổi lần internet lại load lại? do lưu dung lượng quá lớn ? * câu nhắc hết time nghĩ giữa set sao không random thay đổi nữa. mặc định 1 câu, 1 hình ảnh? kiểm tra"

Tức 2 nghi vấn:
1. Ảnh bài tập ở tab "Chọn bài" đã từng tải thành công trước đó — khi mất mạng, không dùng lại được, mỗi lần có mạng lại phải tải lại từ đầu. User tự đặt nghi vấn nguyên nhân là do giới hạn dung lượng cache.
2. Câu nhắc lúc hết giờ nghỉ giữa set không còn random nữa — nghi ngờ luôn mặc định ra đúng 1 câu + 1 icon.

## Kết quả điều tra

### 1. Câu nhắc hết giờ nghỉ (REST_DONE_MESSAGES × REST_DONE_ICONS) — KHÔNG PHẢI BUG, đã xác minh bằng test thật
Gọi trực tiếp hàm dựng banner 20 lần liên tiếp (không phải đọc code suông), ghi lại tần suất xuất hiện của từng câu/icon. Kết quả: 5/6 câu và 2/3 icon đã xuất hiện rải rác trong 20 lần gọi, đúng như kỳ vọng thống kê của `Math.random()` chọn độc lập giữa 2 mảng — không có dấu hiệu bị "đóng băng" ở 1 giá trị cố định. Kết luận: cảm giác "không random" của user nhiều khả năng do trùng ngẫu nhiên nhiều lần liên tiếp trong 1 buổi tập (xác suất không nhỏ với chỉ 6 câu × 3 icon), không phải lỗi code. **Không sửa gì cho phần này.**

### 2. Ảnh bài tập không dùng lại được khi offline — có 2 nguyên nhân thực tế khả dĩ, đã xử lý cả 2
Test thật xác nhận: (a) cơ chế ghi cache khi tải ảnh thành công hoạt động đúng — 19/19 ảnh tải trong 1 phiên test đều được ghi vào `sogym-images-v1`; (b) về mặt logic, nhánh đọc ảnh trong `SW_A7_v1.js`/`SW_A7_v2.js` luôn kiểm tra `cache.match(req)` TRƯỚC khi gọi `fetch()` — nghĩa là 1 khi đã có trong cache, việc trả về ảnh đó không phụ thuộc mạng, về mặt cấu trúc code không thể "phải tải lại" nếu cache còn giữ ảnh đó.

Vậy vấn đề thực tế nằm ở CHỖ ẢNH BỊ RA KHỎI CACHE trước khi user cần lại, do 1 trong 2 nguyên nhân:
- **Giới hạn LRU 150 ảnh/phiên bị vượt quá trong thực tế** — user xác nhận lướt qua nhiều hơn 150 bài trong 1 phiên sử dụng thực tế, khiến ảnh cũ hơn bị `trimImageCache()` tự xoá theo đúng thiết kế LRU trước khi user quay lại xem, rồi phải tải lại từ mạng.
- **Trình duyệt tự ý xoá cache dưới áp lực dung lượng/không hoạt động** — trước A7_v4, app chưa từng gọi `navigator.storage.persist()`, nên Cache Storage của app thuộc diện "best-effort", có thể bị trình duyệt (đặc biệt Safari/iOS) tự dọn mà không báo trước.

User được hỏi và chọn **"Làm cả 2"**: vừa tăng giới hạn, vừa xin trình duyệt giữ chắc storage.

## Fix áp dụng trong SoGym_A7_v4.html + SW_A7_v2.js

1. **`SW_A7_v2.js`** — tăng `IMAGE_CACHE_MAX_ENTRIES` từ `150` lên `400`. Không đổi `CACHE_NAME`/`IMAGE_CACHE_NAME` (không cần bump vì định dạng dữ liệu cache không đổi, chỉ đổi số — ảnh đã cache từ trước với `SW_A7_v1.js` vẫn hợp lệ, không bị xoá sạch oan). Không đổi thuật toán `trimImageCache()`/`touchImageCacheEntry()`.
2. **`SoGym_A7_v4.html`** — đổi đường dẫn đăng ký sang `./SW_A7_v2.js`; thêm gọi `navigator.storage.persist()` ngay sau đoạn đăng ký SW (an toàn gọi luôn, không chờ phản hồi, không ảnh hưởng gì nếu trình duyệt không hỗ trợ/từ chối); cập nhật lại 1 comment cũ gần `thumbHTML()` đang nhắc nhầm tới `SW_A7_v1.js`/giới hạn 150 cho khớp thực tế mới.

## Test lại (real, trên chính SoGym_A7_v4.html qua Claude Preview)

1. **Đăng ký SW mới sạch sẽ**: xoá hết SW registration + cache cũ (`getRegistrations()`+`unregister()`, `caches.keys()`+`caches.delete()`), reload trang → `navigator.serviceWorker.controller.scriptURL` = đúng `SW_A7_v2.js`. PASS.
2. **`navigator.storage.persist()` không phá vỡ gì**: gọi trực tiếp, `supported:true`, `threw:null`, `callResult:false` (trình duyệt sandbox test từ chối cấp persistent — bình thường, môi trường test không có các tín hiệu "engagement" như cài vào màn hình chính; quan trọng là gọi không lỗi, không chặn luồng khởi tạo app). PASS.
3. **Giới hạn LRU 400 hoạt động đúng trên chính code thật đang chạy**: không mô phỏng lại thuật toán bằng tay — trích xuất nguyên văn hàm `trimImageCache()` + hằng số `IMAGE_CACHE_MAX_ENTRIES` từ nội dung `SW_A7_v2.js` thật (`fetch('/SW_A7_v2.js')` rồi dựng lại hàm bằng `Function()` từ đúng source text đó), populate cache ảnh với 405 entry giả theo đúng thứ tự chèn, chạy hàm thật vừa trích xuất → còn lại đúng 400 entry, 5 entry cũ nhất (`img_0`…`img_4`) bị xoá trước — đúng thứ tự LRU, đúng ngưỡng 400 lấy từ chính file thật. PASS.
4. **Hồi quy chung**: 0 lỗi console trong suốt phiên test; chuyển đủ 4 tab (`home`/`picker`/`log`/`history`) qua `switchScreen()` không lỗi; 4 hàm Google Sheets (`gsheetGetOrCreateSheetId`, `gsheetBackup`, `gsheetRestore`, `gsheetApplyRestore`) và `thumbHTML()`/`IMG_BASE` vẫn nguyên vẹn, không bị ảnh hưởng bởi thay đổi SW. PASS.

## Giới hạn đã biết (chưa test được, cần user tự xác nhận)
Không mô phỏng được tình huống "ngắt mạng thật 100%" (kiểu bật chế độ máy bay) trong sandbox test này — công cụ Claude Preview không có tính năng giả lập offline ở tầng request `<img>`/Service Worker (đã kiểm tra `preview_network`, không có tuỳ chọn offline). Vì vậy phần "ảnh đã cache có thực sự hiển thị được khi tắt hẳn mạng" chỉ được xác minh bằng suy luận cấu trúc code (cache-first luôn kiểm tra trước khi fetch) + xác nhận cơ chế ghi cache hoạt động đúng, KHÔNG phải bằng test offline thật 100%. Đây là lý do chính cần user tự kiểm chứng lại trên thiết bị thật.

## Việc KHÔNG làm (ngoài phạm vi)
Không đổi thuật toán `trimImageCache()`/`touchImageCacheEntry()` (chỉ đổi 1 hằng số). Không sửa gì cho câu nhắc hết giờ nghỉ (không phải bug, đã test thật). Không đổi `CACHE_NAME`/`IMAGE_CACHE_NAME` (không cần bump).

## ⚠️ Cần user xác nhận lại trên thiết bị thật (sau khi push GitHub Pages)
1. Dùng bình thường 1 tab như cũ — phải hoạt động y hệt A7_v3, không có gì đổi khác về trải nghiệm thông thường.
2. **Quan trọng nhất**: lướt qua nhiều bài tập ở tab "Chọn bài" (càng nhiều càng tốt, lý tưởng >150 bài như tình huống user từng gặp) khi có mạng, sau đó bật chế độ máy bay/tắt hẳn wifi+data, quay lại tab "Chọn bài" và cuộn qua các bài đã xem — ảnh phải hiện lại được (không phải icon 🏋 dự phòng) cho tới khi vượt quá 400 ảnh gần nhất.
3. Nếu trình duyệt đã cài `SoGym_A7_v3.html`/bản cũ hơn từ trước, tải lại trang 1 lần trên URL A7_v4 để chắc chắn đang chạy đúng `SW_A7_v2.js` mới (có thể kiểm tra nhanh qua DevTools → Application → Service Workers).
