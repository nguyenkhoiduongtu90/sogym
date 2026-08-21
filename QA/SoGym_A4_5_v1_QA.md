# BÁO CÁO QA — Sổ Gym A4.5_v1 (Image Strategy)

**File sửa:** `SoGym_A4_5_v1.html` (dựa trên `SoGym_A4_4_v1.html` đã được anh xác nhận **"A4.4_v1 OK"**, không ghi đè, không sửa file A4.4_v1 gốc) + Service Worker mới `SW_A4_5_v1.js` (không sửa `SW.js` gốc — file đó vẫn phục vụ A4.3_v2/A4.4_v1 y nguyên).
**Phương pháp test:** Chạy THẬT trong trình duyệt (Chromium qua Claude Preview, static server port 8934), kiểm tra Cache Storage/Service Worker/network thật, không phải đọc code suy đoán.
**Roadmap flag:** A4.5 được đánh dấu 🎯 (bắt buộc giả lập 3-5 tình huống lỗi thực tế trước khi báo xong) — đã thực hiện, xem mục 5.

---

## 1. BỐI CẢNH & QUYẾT ĐỊNH THIẾT KẾ (đã hỏi trước khi code)

Khi bắt đầu A4.5, phát hiện file `SoGym_A4_4_v1.html` (đã chốt OK) đã có sẵn một cơ chế ảnh cũ chưa từng ghi nhận trong roadmap: `IMG_BASE` + `LOCAL_THUMBS` (11 bài có ảnh base64 nhúng cứng ~100KB) + `thumbHTML()`. Đã báo cho anh trước khi làm gì tiếp — anh chọn: **"Thiết kế lại từ đầu, không dùng cách hiện tại."**

Sau đó hỏi thêm 3 câu về phạm vi thiết kế, anh chọn cả 3 phương án khuyến nghị:
1. Cache riêng cho ảnh (tách khỏi cache trang/JS/CSS), có giới hạn dung lượng.
2. Giữ emoji 🏋 làm phương án dự phòng khi ảnh lỗi.
3. Chỉ tải ảnh khi thực sự cần (on-demand), không prefetch hàng loạt.

---

## 2. THIẾT KẾ ĐÃ TRIỂN KHAI

- **Bỏ hoàn toàn `LOCAL_THUMBS`** (xoá khối base64 ~100KB) — tất cả 873 bài (và bài tự thêm) dùng chung 1 cách tải ảnh qua mạng, không còn phân biệt "11 bài có sẵn / còn lại không có".
- **`thumbHTML(id)` viết lại:** trả về `<img src="{IMG_BASE}{id}/0.jpg" loading="lazy" onerror="...hiện emoji 🏋...">`. `loading="lazy"` đảm bảo chỉ tải khi ảnh thực sự cuộn tới gần khung nhìn — đúng yêu cầu "on-demand only".
- **Service Worker mới `SW_A4_5_v1.js`** (không đụng `SW.js`): thêm cache riêng `sogym-images-v1`, giới hạn `IMAGE_CACHE_MAX_ENTRIES = 150`, tự xoá ảnh cũ nhất theo kiểu LRU khi vượt giới hạn (`trimImageCache`), "chạm" lại ảnh khi cache hit để đánh dấu vừa dùng (`touchImageCacheEntry`). Chỉ áp dụng logic này cho ảnh từ `raw.githubusercontent.com` — trang/JS/CSS vẫn dùng cache chung `sogym-cache-v2` như cũ.
- **Tên file HTML đăng ký SW mới:** `SoGym_A4_5_v1.html` gọi `navigator.serviceWorker.register('./SW_A4_5_v1.js')` thay vì `./SW.js` — không ảnh hưởng các file đã chốt.

---

## 3. PHÁT HIỆN QUAN TRỌNG TRONG LÚC TEST — GIỚI HẠN OPAQUE RESPONSE (đã hỏi trước khi quyết định)

Trong lúc test tình huống "ảnh không tồn tại" (404), phát hiện: do giới hạn bảo mật của Fetch API, request `<img>` cross-origin không có `crossorigin` luôn trả về **opaque response** (`status` luôn đọc là `0`, không đọc được status thật 200 hay 404). Vì vậy điều kiện cache hiện tại (`res.status === 200 || res.type === 'opaque'`) **không phân biệt được** ảnh tải thành công thật với ảnh lỗi/404 — một bài bị lỗi mạng tạm thời có thể bị cache lại như đã tải xong, và sẽ không tự thử lại cho tới khi bị đẩy khỏi cache (LRU, tối đa 150 ảnh).

Đã thử phương án dùng `crossorigin="anonymous"` để đọc được status thật — **không khả thi**: test thật cho thấy ảnh thật (`Barbell_Full_Squat`) fetch với `mode:'cors'` bị lỗi thẳng `TypeError: Failed to fetch` (CDN ảnh thật của GitHub không trả CORS header cho ảnh thành công, chỉ trang lỗi 404 mới có CORS header) — nếu bắt buộc CORS sẽ làm toàn bộ ảnh thật không tải được nữa.

Đã kiểm tra kỹ hậu quả thực tế: dù bị cache nhầm, emoji 🏋 dự phòng **vẫn luôn hiện đúng** cho người dùng (vì trình duyệt không giải mã được nội dung lỗi thành ảnh, `onerror` vẫn chạy) — xác nhận qua test thật (`afterError: '🏋'` dù `wasCachedDespite404: true`). Không có lỗi hiển thị nào tới người dùng, chỉ tốn 1 chỗ trống cache (trên tổng 150) và mất khả năng tự thử tải lại cho bài đó cho tới khi bị đẩy khỏi cache.

**Đã hỏi anh cách xử lý — anh chọn: "Giữ nguyên, chấp nhận."** Đây là giới hạn cố hữu của nền tảng trình duyệt (không phải lỗi có thể sửa triệt để), phù hợp triết lý "đơn giản, on-demand" đã thống nhất cho A4.5.

---

## 4. KẾT QUẢ TEST CƠ BẢN (chạy thật, có số liệu)

| Test | Kết quả |
|---|---|
| App tải, splash ẩn, Home hiện, 0 console error | PASS |
| Catalog 873 bài còn nguyên | PASS |
| Service Worker đúng là `SW_A4_5_v1.js` đang kiểm soát trang | PASS |
| `LOCAL_THUMBS` đã bị xoá hoàn toàn (`typeof LOCAL_THUMBS === 'undefined'`) | PASS |
| `thumbHTML()` trả về URL mạng đúng định dạng, không còn base64 | PASS |
| Ảnh thật tải qua mạng → vào đúng cache riêng `sogym-images-v1` (không lẫn vào `sogym-cache-v2`) | PASS — 21 entries sau khi xem danh sách Picker đã lọc |
| Giới hạn 150 ảnh + tự xoá ảnh cũ nhất (LRU) khi vượt | PASS — seed 140 ảnh giả + 21 thật = 161 → tự trim đúng còn 150, xác nhận đúng các ảnh cũ nhất bị xoá, ảnh mới nhất còn nguyên |

---

## 5. GIẢ LẬP TÌNH HUỐNG LỖI THỰC TẾ (bắt buộc do A4.5 gắn cờ 🎯)

| # | Tình huống | Cách test | Kết quả |
|---|---|---|---|
| 1 | Ảnh không tồn tại thật (404 CDN) — kiểm tra fallback emoji có chạy đúng không | Chèn `thumbHTML()` với ID bài không tồn tại, đợi thật | Ban đầu tưởng lỗi (không thấy `onerror` chạy trong 2s khi test bằng cách chèn `<img loading="lazy">` vào 1 `<div>` tách rời chưa gắn vào layout thật) — **điều tra kỹ phát hiện đây là do cách test sai, không phải bug thật**: `loading="lazy"` cần trình duyệt xác định phần tử gần khung nhìn mới bắt đầu tải; phần tử test bị tách rời layout nên trình duyệt không bao giờ quyết định tải. Test lại đúng cách (bỏ `loading="lazy"` để cô lập biến số, hoặc gắn đúng vào layout thật) → `onerror` chạy đúng trong 3s, hiện 🏋 chính xác. **PASS** sau khi sửa cách test |
| 2 | Lỗi mạng thật (không phải 404, mà là host không kết nối được — mô phỏng offline/CDN bị chặn) | `<img>` trỏ tới host không tồn tại (`.invalid`), đợi thật 4s | **PASS** — nhánh `catch(e)` trong SW trả về response rỗng đúng cách, `onerror` chạy, hiện 🏋, không bị treo |
| 3 | Cache ảnh hoàn toàn trống (lần đầu dùng app, chưa từng cache ảnh nào) | Xác nhận `sogym-images-v1` có 0 entries → tải 1 ảnh thật qua `thumbHTML()` | **PASS** — ảnh tải thành công (`naturalWidth > 0`), cache tự tạo entry đầu tiên đúng, không lỗi |
| 4 | 2 Service Worker cùng tồn tại trên cùng origin (`SW.js` của A4.3_v2/A4.4_v1 đã chốt, và `SW_A4_5_v1.js` mới) — rủi ro 1 SW "đè" SW kia vì cùng scope mặc định (thư mục gốc) | Điều hướng thật: A4.4_v1.html (đăng ký SW.js) → A4.5_v1.html (đăng ký SW_A4_5_v1.js) → quay lại A4.4_v1.html | **PASS** — mỗi trang luôn được đúng SW của nó kiểm soát (`controller.scriptURL` đúng `SW.js` / `SW_A4_5_v1.js` tương ứng từng lần), catalog 873 bài nguyên vẹn cả 2 chiều, 0 console error — xác nhận A4.5 không phá vỡ A4.4_v1 đã chốt |
| 5 | Response opaque (không phân biệt được 200/404 do giới hạn bảo mật trình duyệt) có gây cache sai ảnh lỗi thành "đã tải xong" không | Fetch 1 ID không tồn tại thật qua `<img>`, kiểm tra cache sau đó | Xác nhận **có** bị cache (giới hạn nền tảng, không sửa triệt để được) nhưng **không gây lỗi hiển thị thật** — emoji 🏋 vẫn luôn hiện đúng. Đã báo và xin ý kiến anh — xem mục 3. **Chấp nhận theo quyết định của anh, không phải bug cần sửa** |

**Kết luận:** 5/5 tình huống đã giả lập thật, cộng thêm 6 test cơ bản ở mục 4 (tổng 11 test thật). Không phát hiện bug ảnh hưởng người dùng. Không cần tạo A4.5_v2.

**Dọn dẹp:** 140 entries giả (`FakeSeed_*`) tạo ra trong lúc test giới hạn LRU đã được kiểm tra lại — cache `sogym-images-v1` đã tự về trạng thái sạch (0 entries) trước khi viết báo cáo này (không cần thao tác xoá thủ công thêm).

---

## 6. LỖI CÒN TỒN TẠI / GHI NHẬN (không tự ý xử lý)

- Giới hạn opaque-response (mục 3) — đã báo, anh xác nhận chấp nhận, không phải bug cần sửa ở A4.5.
- NOT TESTABLE trong môi trường này: iPhone/Safari thật, tắt mạng thật hoàn toàn (airplane mode thật) — chỉ mô phỏng được lỗi mạng bằng cách trỏ tới host không tồn tại, kết quả tương đương về mặt hành vi code (nhánh catch/offline), nhưng chưa test trên thiết bị thật.
- Đây là A4.5_v1 lần đầu — nếu anh muốn thêm cải tiến khác (ví dụ: preload ảnh khi mở trang chi tiết bài tập, đổi giới hạn 150, v.v.) sẽ làm ở A4.5_v2 theo đúng quy tắc từng bước.

---

## 7. FILE KẾT QUẢ

- `SoGym_A4_5_v1.html` — file chính, đã sửa và test.
- `SW_A4_5_v1.js` — Service Worker mới riêng cho A4.5.
- `SoGym_A4_5_v1_QA.md` — báo cáo này.
- `SoGym_A4_4_v1.html`, `SoGym_A4_3_v2.html`, `SW.js` — **không đổi**, đã xác nhận nguyên trạng qua test tình huống 4 ở mục 5.

**Trạng thái:** Đã hoàn thành thiết kế lại chiến lược ảnh theo đúng 3 lựa chọn anh chọn (cache riêng có giới hạn, giữ emoji dự phòng, chỉ tải on-demand). Đã giả lập đủ 5 tình huống lỗi thực tế bắt buộc (do A4.5 gắn cờ 🎯), phát hiện 1 giới hạn nền tảng (opaque response) đã báo và được anh xác nhận chấp nhận, không phải bug. Chờ anh xác nhận **"A4.5_v1 OK"** trước khi sang bước kế tiếp (A4.6).
