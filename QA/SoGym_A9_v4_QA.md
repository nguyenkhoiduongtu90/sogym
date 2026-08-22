# QA — SoGym_A9_v4.html — Fix 2 lỗi input ngày tràn viền, tăng icon "Cơ thể", cải thiện trải nghiệm PWA

File: `SoGym_A9_v4.html` (copy từ `SoGym_A9_v3.html`, file gốc giữ nguyên không sửa).
SW không đổi — vẫn dùng `SW_A7_v2.js`.

## Bối cảnh

Sau khi `SoGym_A9_v3.html` được push live, user real-device-test và gửi 1 tin nhắn gồm 10 mục:
2 lỗi ô nhập ngày tràn viền, 1 yêu cầu tăng icon "Cơ thể" (kèm câu hỏi nhờ đánh giá mức tăng phù hợp),
và 6 câu hỏi khái niệm/PWA (Giai đoạn A đã xong chưa, dùng app tiếp theo thế nào, pull-to-refresh,
màn hình tự tối, double-tap zoom, khoá thanh công cụ, cách phân phối link). Toàn bộ đã xử lý trong
bản v4 này.

## Phần 1 — Lỗi #1: ô "Từ ngày"/"Đến ngày" (tab Lịch sử) tràn khung viền ngoài

**Nguyên nhân:** CSS Grid "blowout" kinh điển — 2 `<div>` bọc `#exportFrom`/`#exportTo` nằm trong
`display:grid; grid-template-columns:1fr 1fr` nhưng KHÔNG có `min-width:0`. Mặc định grid item có
`min-width:auto`, tức là item không co nhỏ hơn kích thước nội dung nội tại (native `<input
type="date">` của Safari có kích thước nội tại lớn hơn đáng kể so với Chromium) — dù track được
định nghĩa `1fr`, item vẫn có thể bị đẩy tràn ra ngoài card khi nội dung của nó rộng hơn track.

**Fix:** thêm `min-width:0` vào cả 2 `<div>` bọc, và `min-width:0; width:100%; box-sizing:border-box`
trực tiếp vào 2 input — cùng kỹ thuật đã áp dụng sẵn cho `#bodyDateInp` ở A9_v1.

**Kiểm chứng (Claude Preview MCP, thật qua DOM, không phải đọc code):** không tái hiện được tràn
viền trên Chromium ở cả 375px lẫn 320px (đúng như dự đoán — đây là lỗi đặc thù engine render input
ngày của Safari/iOS, Chromium có input ngày nhỏ gọn hơn) — nhưng nguyên nhân gốc (thiếu `min-width:0`
trên grid item) là lỗi CSS thật, độc lập trình duyệt, nên fix vẫn đúng và cần thiết. Sau fix: đo trực
tiếp `getBoundingClientRect()` xác nhận `#exportFrom`/`#exportTo` luôn nằm gọn trong biên `.card` ở
cả 320px và 375px, không có trường hợp nào `right` của input vượt `right` của card.

## Phần 2 — Lỗi #2: ô "Ngày" (tab Cơ thể) tràn khung viền ngoài

**Nguyên nhân:** khác lỗi #1 — code đã có sẵn `min-width:0` ở CẢ 2 chỗ (div bọc và input) từ trước,
nhưng vẫn tràn trên máy thật. Nguyên nhân thực sự: `#bodyDateInp` dùng chung 1 hàng flex với nút
"Hôm nay" (`flex-shrink:0`, không co). Trên màn hẹp, phần không gian còn lại dành cho input ngày sau
khi trừ nút "Hôm nay" bị ép quá hẹp — `min-width:0` cho phép HỘP input co nhỏ về mặt layout, nhưng
input ngày gốc của Safari/iOS có các phân đoạn ngày/tháng/năm + icon lịch render nội bộ (shadow DOM)
với độ rộng tối thiểu cứng, không co theo hộp CSS được — khi hộp nhỏ hơn mức đó, nội dung hiển thị
tràn ra ngoài biên input dù bản thân hộp không "vỡ" layout.

**Fix (cấu trúc, không chỉ thêm CSS):** tách input ngày ra 1 hàng riêng full-width (không còn chia sẻ
hàng với nút "Hôm nay"), nút "Hôm nay" chuyển xuống hàng dưới, cũng full-width. Input ngày nay có
toàn bộ chiều rộng card để render, không còn phải cạnh tranh không gian với nút bên cạnh.

**Kiểm chứng:** đo `getBoundingClientRect()` ở 320px và 375px — `#bodyDateInp` luôn nằm gọn trong
`.card` (vd ở 320px: card right=304.0, input right=287.0). Test chức năng: gán giá trị cũ, bấm nút
"Hôm nay" → input cập nhật đúng về ngày hôm nay (`2026-08-22`) — không hồi quy.

## Phần 3 — Yêu cầu #3: tăng icon "Cơ thể" (nav bar dưới)

User đề nghị +200% và chủ động nhờ đánh giá mức phù hợp. `.nav-icon` là 1 class CSS dùng chung cho
**cả 5 tab** nav bar (không chỉ riêng "Cơ thể"), hiện `22px`.

**Đánh giá +200% theo đúng nghĩa đen (22px → 66px, gấp 3):** đo thực tế mỗi nav-item chỉ rộng
**64px** ở màn 320px — một icon 66px sẽ RỘNG HƠN CẢ Ô TAB chứa nó, chắc chắn icon 2 tab cạnh nhau sẽ
đè lên nhau. Kết luận: không phù hợp, không áp dụng mức này.

**Mức đã chọn:** `22px → 30px` (+36%). Kiểm chứng ở 320px: khoảng cách giữa 2 icon liền kề tối thiểu
~34px, 0 chồng lấn, nhãn chữ ("Hôm nay"/"Chọn bài"/"Nhập set"/"Lịch sử"/"Cơ thể") vẫn nguyên vẹn 1
dòng. Chiều cao nav bar tăng nhẹ 8px→77px (đo thực tế), không tràn màn hình. Đây là mức tăng rõ rệt
bằng mắt thường (lớn hơn ~36%) nhưng vẫn an toàn về layout. Nếu user vẫn thấy chưa đủ lớn sau khi
xem trên máy thật, có thể tăng thêm ở bản sau — không tăng thẳng lên 66px ngay để tránh lỗi chồng
icon giữa các tab.

## Phần 4 — Yêu cầu #6, #7, #8: 3 cải thiện hành vi PWA

Trước khi sửa, đã kiểm tra: file KHÔNG có `manifest.json`, KHÔNG có `overscroll-behavior`, KHÔNG có
`touch-action` ở bất kỳ đâu (grep xác nhận 0 kết quả) — 3 cơ chế này hoàn toàn chưa tồn tại.

- **Pull-to-refresh (mục f):** thêm `overscroll-behavior-y:none` cho cả `html` và `body`. Ngăn hành vi
  "kéo hết xuống là load lại trang" khi cuộn tới đầu/cuối danh sách. Kiểm chứng: `getComputedStyle`
  xác nhận thuộc tính đã áp dụng, cuộn bình thường trong app không bị ảnh hưởng.
- **Double-tap zoom (mục h):** thêm `touch-action:manipulation` vào rule `*{}` toàn cục. Vô hiệu hoá
  cử chỉ double-tap-to-zoom của Safari (điều mà riêng `maximum-scale=1.0` trong viewport meta KHÔNG
  đủ để chặn trên iOS Safari hiện đại — Safari cố tình bỏ qua để đảm bảo accessibility) trong khi vẫn
  giữ nguyên khả năng cuộn/pinch-zoom bình thường. Kiểm chứng: nút +15s/-15s xác nhận có
  `touch-action:manipulation`; bấm nhanh liên tiếp 3 lần không lỗi console, không hành vi lạ.
- **Màn hình tự tối (mục g):** thêm Wake Lock API (`navigator.wakeLock.request('screen')`), xin lại
  mỗi khi app quay lại foreground (`visibilitychange`) hoặc có tương tác chạm/click đầu tiên (một số
  trình duyệt yêu cầu đã có tương tác trước khi cho giữ màn hình). **Giới hạn thành thật:** một số bản
  Safari/iOS cũ chưa hỗ trợ API này — code có `if('wakeLock' in navigator)` guard, không hỗ trợ thì
  im lặng bỏ qua, không ảnh hưởng chức năng khác (đã test giả lập trình duyệt không hỗ trợ → xác nhận
  không throw lỗi). Cũng không đảm bảo giữ sáng 100% mọi lúc (trình duyệt có thể từ chối khi pin yếu),
  nhưng sẽ giảm đáng kể tần suất tự khoá màn hình giữa buổi tập so với hiện tại (0% → có cơ chế xin).

## Phần 5 — Test hồi quy toàn diện (Claude Preview MCP)

Ở cả 320px và 375px viewport: 5 tab (Hôm nay/Chọn bài/Nhập set/Lịch sử/Cơ thể) đều chuyển màn đúng,
`document.documentElement.scrollWidth` KHÔNG vượt `window.innerWidth` ở bất kỳ tab nào (0 tràn ngang
toàn trang). Nav icon active/inactive opacity (1 / 0.55) vẫn đúng khi đổi tab. 0 console error trong
suốt quá trình test.

## Việc KHÔNG làm

- Không thêm `manifest.json` — 2 câu hỏi "khoá thanh công cụ" (mục i) và "khỏi phải dán link mỗi lần"
  (mục j) đều được giải quyết bằng cơ chế **"Thêm vào MH chính" (Add to Home Screen)** đã có sẵn hạ
  tầng từ trước (`apple-mobile-web-app-capable`/`apple-mobile-web-app-status-bar-style`/
  `apple-mobile-web-app-title` — xác nhận cả 3 đã có trong `<head>`). `manifest.json` chủ yếu phục vụ
  cơ chế cài đặt của Android/Chrome; phạm vi dự án hiện tại chỉ nhắm iPhone/Safari (theo A0), nên
  không cần thêm để tránh phức tạp không cần thiết. Xem thêm giải thích ở tin nhắn báo cáo.
- Không tăng `.nav-icon` lên đúng 66px (+200% theo nghĩa đen) — lý do ở Phần 3.
- Không đổi `.btn-icon` (35px, đã fix ở A9_v3) hay `.ring` (đã fix ở A9_v3) — ngoài phạm vi yêu cầu lần này.

## Chờ xác nhận từ user

Chưa push. Sẽ chỉ push lên GitHub thay `SoGym_A9_v3.html` sau khi user xác nhận đồng ý rõ ràng.
