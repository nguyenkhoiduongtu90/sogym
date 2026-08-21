# QA — SoGym_A7_v2.html — Fix: Service Worker cache đè dữ liệu Khôi phục Google Sheets

**Ngày:** 2026-08-21
**File:** `SoGym_A7_v2.html` (copy từ `SoGym_A7_v1.html`, chỉ đổi `<title>`, thêm comment A7_v2, đổi đường dẫn đăng ký Service Worker sang `./SW_A7_v1.js`)
**SW:** MỚI — `SW_A7_v1.js` (copy từ `SW_A4_5_v1.js`, KHÔNG sửa `SW_A4_5_v1.js` — file đó giữ nguyên byte-for-byte cho các bản đã confirm OK trước đó: A4.5_v9, A6_v1, A6_v2)
**Trạng thái:** PENDING — chờ user xác nhận "A7_v2 OK" trên thiết bị thật (GitHub Pages), xem checklist ở cuối file.

## Bug được báo bởi user (test thật trên GitHub Pages, 2026-08-21)
Sau khi Sao lưu lên Google Sheets 2 lần (2 dòng dữ liệu, xác nhận bằng mắt trực tiếp trên Google Sheet), bấm "⬇ Khôi phục từ Google Sheets" chỉ hiện **đúng 1 dòng — bản CŨ NHẤT** (`...T06:55:02`), không thấy bản mới (`...T07:02:24`). Bấm lại nút Khôi phục nhiều lần (kể cả sau vài phút) vẫn hiện y hệt kết quả cũ — loại trừ khả năng do độ trễ đồng bộ tạm thời.

## Root cause (xác nhận bằng cách đọc code thật, không đoán)
`SW_A4_5_v1.js` (Service Worker) có nhánh cache-chung ở cuối `fetch` listener áp dụng **cache-first cho MỌI request GET không phải navigation và không phải ảnh từ `IMG_HOST`** — không phân biệt request đó cùng gốc (origin) với app hay đi tới nguồn ngoài. Vì `gsheetRestore()` gọi `GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/Backups!A2:B` — cùng 1 URL cố định (chỉ phụ thuộc `spreadsheetId`, không đổi giữa các lần) — lần gọi ĐẦU TIÊN được SW lưu vào `caches` (Cache Storage API, độc lập với HTTP cache-control header của Google), và **mọi lần gọi sau, vĩnh viễn, đều được SW trả lại y nguyên response đã cache đó thay vì đi ra mạng** — dù dữ liệu thật trên Google Sheets đã thay đổi (thêm dòng mới). Đây chính là lý do bấm lại nhiều lần vẫn không đổi kết quả.

Vì sao QA của A7_v1 không phát hiện ra: bộ test trước đó dùng Claude Preview với `window.fetch` bị **mock (ghi đè) ở tầng trang** — khi `gsheetApiFetch()` gọi `fetch(...)`, nó gọi đúng hàm mock, không bao giờ thực sự đi ra network, nên Service Worker (chỉ can thiệp ở tầng network thật) **chưa từng được test tới** trong toàn bộ vòng test mocked trước đó. Đây là giới hạn thật của phương pháp mock, đã ghi nhận lại ở đây để rút kinh nghiệm cho các bước sau có Service Worker + gọi mạng thật.

## Fix
Tạo `SW_A7_v1.js` mới (không sửa `SW_A4_5_v1.js`, theo đúng quy tắc "bug ở bước hiện tại thì ra bản mới của chính bước đó, không sửa đè file baseline đã confirm"):
- Thêm kiểm tra `isSameOrigin` (so `new URL(req.url).origin` với `self.location.origin`).
- Nhánh cache-chung (cache-first) ở cuối chỉ áp dụng khi `isSameOrigin === true`. Nếu KHÔNG cùng gốc (Google Sheets API, script đăng nhập Google...) → luôn `event.respondWith(fetch(req))`, đi thẳng ra mạng, không đọc/ghi cache.
- Nhánh navigation và nhánh ảnh (`IMG_HOST`) giữ nguyên không đổi (đã tách riêng từ trước, không phải nguồn gây bug).
- `CACHE_NAME` bump `sogym-cache-v2` → `sogym-cache-v3` để `activate()` (logic có sẵn, không đổi) tự xoá sạch cache cũ có thể đang chứa response Google Sheets bị cache nhầm từ trước khi vá.

`SoGym_A7_v2.html`: đổi `navigator.serviceWorker.register('./SW_A4_5_v1.js')` → `register('./SW_A7_v1.js')`, cập nhật `<title>` + comment thay đổi ở đầu file + 1 dòng comment khác nhắc tên file SW (khu vực ảnh bài tập).

## Kiểm thử (test THẬT, không mock — đúng tầng đang có bug: Service Worker + network thật)
Vì không thể test bằng chính Google Sheets API thật (cần OAuth thật, không chạy được trên origin `localhost` của Preview — giới hạn đã biết từ A7_v1), đã dựng 1 server đếm số riêng, tạm thời (`_test_counter_server.py`, cổng 8936, có header CORS, đã xoá sau khi test xong — không phải file của dự án), mô phỏng chính xác đặc điểm gây bug: **1 URL cố định, response thay đổi mỗi lần gọi thật, nằm khác gốc hoàn toàn với app** — giống hệt đặc điểm của URL Google Sheets API. Test bằng `fetch()` thật (không ghi đè) gọi trực tiếp từ trang đang chạy trong Claude Preview (Chromium thật), qua đúng Service Worker đang active.

1. **Tái hiện bug với SW cũ** (`SoGym_A7_v1.html`, đăng ký `SW_A4_5_v1.js`, đã xoá sạch cache/SW cũ trước khi test): gọi `fetch(counterURL)` 3 lần liên tiếp → cả 3 lần đều trả về **"3"** (y hệt nhau). Gọi trực tiếp server bằng `curl` (không qua SW) ngay sau đó → trả về **"4"** — chứng minh server thật vẫn đang tăng đều, nhưng SW đã khoá cứng response đầu tiên. Tái hiện ĐÚNG bug user báo cáo. PASS (bug reproduced).
2. **Xác nhận fix với SW mới** (`SoGym_A7_v2.html`, đăng ký `SW_A7_v1.js`, đã xoá sạch cache/SW cũ trước khi test): gọi `fetch(counterURL)` 3 lần liên tiếp → trả về lần lượt **"5", "6", "7"** — mỗi lần đều đi ra mạng thật, không còn bị cache. PASS.
3. **Hồi quy — cache cùng gốc vẫn hoạt động** (đảm bảo fix không làm mất khả năng cache offline vốn có cho tài nguyên của chính app): tải lại trang lần 2 (lúc này SW mới đã kiểm soát trang) → kiểm tra `caches.open('sogym-cache-v3')` → có đúng 1 entry là chính URL trang HTML (cùng gốc) → xác nhận nhánh cache-first cho tài nguyên cùng gốc không bị ảnh hưởng bởi fix. PASS.
4. **Hồi quy chung:** 0 lỗi console; gọi `switchScreen()` qua đủ 4 tab (Hôm nay/Chọn bài/Nhập set/Lịch sử) không lỗi.

## Việc KHÔNG làm (ngoài phạm vi bug này)
Không sửa `SW_A4_5_v1.js` (giữ nguyên cho A4.5_v9/A6_v1/A6_v2). Không đổi logic `gsheetRestore()/gsheetBackup()` (bug nằm hoàn toàn ở tầng Service Worker, không phải ở code fetch trong `SoGym_A7_v2.html`).

## ⚠️ Cần user xác nhận lại trên thiết bị thật (sau khi push GitHub Pages)
Vì bug gốc CHỈ xảy ra khi có Service Worker thật (không hoạt động trên `file://`, và Claude Preview không thể test Google Sheets API thật — xem giới hạn đã ghi ở `QA/SoGym_A7_v1_QA.md`), cần user xác nhận lại đúng 3 bước đã làm dở trước đó, lần này trên `https://nguyenkhoiduongtu90.github.io/sogym/SoGym_A7_v2.html`:
1. Bấm "⬇ Khôi phục từ Google Sheets" → danh sách phải hiện **ĐỦ CẢ 2 dòng** đã sao lưu trước đó, **mới nhất lên đầu** (`...T07:02:24` phải đứng trên `...T06:55:02`).
2. Bấm Sao lưu thêm 1 lần nữa (dòng thứ 3) → bấm Khôi phục lại → danh sách phải cập nhật thêm dòng mới nhất đó, đúng thứ tự.
3. (Vì đây là Service Worker MỚI, khác file cũ) nếu trình duyệt đã cài Service Worker `SW_A4_5_v1.js` từ lần mở A7_v1 trước đó, có thể cần **tải lại trang 1 lần** (hoặc đóng hẳn tab rồi mở lại) để trình duyệt chuyển hẳn sang `SW_A7_v1.js` mới — nếu vẫn thấy hiện tượng cũ ngay lần đầu, thử tải lại trang thêm 1 lần rồi thử lại trước khi báo lỗi tiếp.
