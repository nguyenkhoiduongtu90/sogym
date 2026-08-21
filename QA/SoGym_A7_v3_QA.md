# QA — SoGym_A7_v3.html — Audit chủ động 7 tình huống lỗi thật cho Google Sheets + Fix race điều kiện nhiều tab

**Ngày:** 2026-08-21
**File:** `SoGym_A7_v3.html` (copy từ `SoGym_A7_v2.html`, chỉ đổi `<title>`, thêm comment A7_v3, sửa `gsheetGetOrCreateSheetId()`)
**SW:** không đổi — vẫn dùng `SW_A7_v1.js` (bug lần này không liên quan Service Worker)
**Trạng thái:** PENDING — chờ user xác nhận lại toàn bộ luồng Google Sheets trên thiết bị thật, sau đó mới coi bước A7 là xong.

## Lý do đợt audit này
Sau khi A7_v2 fix xong bug Service Worker cache đè dữ liệu Khôi phục (xem `QA/SoGym_A7_v2_QA.md`), user yêu cầu chủ động giả lập 5-7 tình huống có thể gây lỗi cho các chức năng Google Sheets mới, theo đúng tinh thần đã rút kinh nghiệm từ đợt audit A4.5_v6→v9 (lỗi thật bị bỏ sót bởi QA hời hợt, phải test lại kỹ bằng tình huống thực tế). Yêu cầu nguyên văn: *"giả lập 5-7 tình huống có thể xảy ra lỗi đối với các chức năng mới, các lỗi tương tự như ở v6, phân tích, tránh lỗi, đưa giải pháp tối ưu và sửa chữa"*.

Đây là ngoài phạm vi 5 tình huống 🎯 bắt buộc đã test và PASS ở QA gốc của A7_v1 (đóng popup, popup bị chặn, mất mạng lúc append, token 401 tự thử lại, sheet bị xóa 404).

## Phương pháp
Test thật (không đoán) trên trang chạy trong Claude Preview (Chromium thật), gọi trực tiếp các hàm JS thật (`gsheetGetOrCreateSheetId()`, `gsheetBackup()`, `gsheetRestore()`, `gsheetApplyRestore()`) và/hoặc click nút thật, có mock `fetch`/`alert`/`confirm` ở tầng trang khi cần mô phỏng lỗi mạng hoặc kiểm soát thời gian phản hồi — chấp nhận được cho lớp lỗi ở tầng JS ứng dụng (khác với bug A7_v2 nằm ở tầng Service Worker, buộc phải test bằng network thật, xem giới hạn đã ghi ở `QA/SoGym_A7_v2_QA.md`).

## Kết quả từng tình huống

### 1. Bấm dồn dập nút "☁️ Sao lưu" nhiều lần liên tiếp (1 tab) — PASS, không có bug
`button.disabled = true` là dòng đầu tiên, đồng bộ, trong handler — do JS đơn luồng và dispatch sự kiện chỉ chạy khi hàng đợi rảnh, việc disable xảy ra trước khi trình duyệt có thể xử lý click thứ 2, và `.click()`/click thật trên nút đã `disabled` không kích hoạt lại listener. Test: gọi `btnGSheetBackup.click()` 3 lần liên tiếp trong cùng 1 tick → chỉ 1 lần gọi `gsheetBackup()` thật sự chạy.

### 2. Bấm dồn dập nút "⬇ Khôi phục" nhiều lần liên tiếp (1 tab) — PASS, không có bug
Cùng cơ chế bảo vệ như (1), áp dụng cho `btnGSheetRestore`.

### 3. Bấm gần như đồng thời cả 2 nút Sao lưu + Khôi phục (1 tab) — PASS, không có bug
2 nút độc lập, mỗi nút tự disable chính nó, không có state dùng chung nào bị ghi đè giữa 2 luồng — cả 2 chạy song song an toàn, không xung đột.

### 4. 2 tab cùng lúc, CẢ HAI đều là lần Sao lưu đầu tiên (chưa có Sheet) — **BUG THẬT, đã sửa (xem bên dưới)**
Test bằng `Promise.all([gsheetGetOrCreateSheetId(), gsheetGetOrCreateSheetId()])` sau khi xóa `sogym_google_sheet_id`, mock POST create trả về 2 id giả khác nhau. Kết quả TRƯỚC khi sửa (trên `SoGym_A7_v2.html`): `createCallCount:2`, cả 2 lệnh gọi đều tạo Sheet riêng, `localStorage` cuối cùng chỉ giữ id của lệnh ghi sau — id của lệnh kia bị lãng quên hoàn toàn, im lặng (không có lỗi/cảnh báo nào) dù Sheet đó vẫn tồn tại thật trên Drive với dữ liệu sao lưu thật bên trong. Chi tiết fix và kết quả test lại: xem mục "Fix" bên dưới.

### 5. Ranh giới cài đặt/kích hoạt Service Worker (fetch bắn ra trước khi `serviceWorker.ready` resolve) — PASS, không có bug
Fix origin-scoping của A7_v2 nằm trong logic `fetch` listener, không phụ thuộc thời điểm SW đã "ready" hay chưa — mọi request tới `sheets.googleapis.com` đều được nhận diện khác gốc và đi thẳng ra mạng ngay từ request đầu tiên SW xử lý được, kể cả những request bắn ra rất sớm.

### 6. Mất mạng đúng lúc đang tải danh sách bản sao lưu (GET Khôi phục) — PASS, không có bug
Test bằng cách mock `fetch` để mọi GET có `/values/` trong URL reject với `TypeError` (mô phỏng lỗi mạng thật). Kết quả: `gsheetRestore()` rơi đúng vào `.catch()` sẵn có → `gsheetSetStatus(..., true)` hiện đúng thông báo lỗi tiếng Việt, `alert()` hiện thông báo rõ ràng ("Khôi phục từ Google Sheets thất bại: ..."), nút Khôi phục tự bật lại (`.finally()`), danh sách KHÔNG hiện dữ liệu cũ/hỏng/một phần (`gsheetRestoreList` rỗng, `display:none`). Không cần sửa gì — code đã xử lý đúng từ trước.

### 7. Token hết hạn đúng vào khoảng giữa lúc tải xong danh sách và lúc bấm 1 dòng "Khôi phục" cụ thể — PASS, không có bug
Phân tích code: `gsheetApplyRestore(ts, jsonText)` (hàm chạy khi bấm 1 dòng trong danh sách) là thao tác THUẦN LOCAL — chỉ `JSON.parse` + `migrateData()` + gán vào `state` + `saveState()` + `runIntegrityCheck()` + render lại UI — không có bất kỳ lệnh gọi mạng nào. Đã verify bằng test thật (không chỉ đọc code suông, đúng quy tắc dự án): xóa `gsheetAccessToken`, ghi đè `fetch` để throw ngay nếu bị gọi (`SHOULD NOT BE CALLED`), rồi bấm nút "Khôi phục" trên 1 dòng đã render sẵn → khôi phục thành công hoàn toàn, `fetchWasCalled: false` xác nhận không có request mạng nào được gọi, dữ liệu được ghi đúng vào `state.history` và `localStorage['sogym_data_v1']`.

## Fix cho bug Scenario 4 (race điều kiện tạo trùng Google Sheet khi 2 tab)
Sửa `gsheetGetOrCreateSheetId()` trong `SoGym_A7_v3.html`: sau khi tạo Sheet mới xong (vừa có id thật từ Google), kiểm tra lại `localStorage` NGAY TRƯỚC khi ghi:
- Nếu `localStorage` đang RỖNG hoặc đã có ĐÚNG id vừa tạo → ghi bình thường (trường hợp không có race, hoặc chính lệnh gọi này đã "thắng").
- Nếu `localStorage` đã có id KHÁC (một tab/lệnh gọi khác đã tạo Sheet của nó và ghi trước) → KHÔNG ghi đè, ném lỗi rõ ràng: `Một tab/thiết bị khác vừa tạo Google Sheet gần như cùng lúc — vui lòng bấm "Sao lưu" lại lần nữa.` Lỗi này tự động rơi vào khối `.catch()` sẵn có của `gsheetBackup()` — không cần sửa gì thêm ở đó.

Đây được coi là giải pháp tối ưu cho app cá nhân/1 người dùng: không cần cơ chế khóa phân tán/polling phức tạp (không phù hợp triết lý offline-first, không server riêng của dự án); chỉ cần đảm bảo KHÔNG BAO GIỜ âm thầm mất dấu vết 1 trong 2 Sheet — lệnh thua vẫn còn dữ liệu thật trên Drive (không mất dữ liệu), chỉ là app tạm thời không biết tới nó, và người dùng được báo rõ để thử lại (lúc đó sẽ tự động dùng đúng id đã thắng, xem test lại bên dưới).

### Test lại (real, trên chính `SoGym_A7_v3.html`)
1. Race thật: `Promise.all([gsheetGetOrCreateSheetId(), gsheetGetOrCreateSheetId()])` sau khi xóa `sogym_google_sheet_id`, mock POST trả 2 id khác nhau với độ trễ khác nhau (lệnh gọi #2 trả lời TRƯỚC lệnh #1, tái hiện đúng kiểu race bất định) → kết quả: lệnh #1 nhận lỗi rõ ràng ("Một tab/thiết bị khác vừa tạo Google Sheet gần như cùng lúc..."), lệnh #2 thành công với id của nó, `localStorage` cuối cùng CHỈ có đúng 1 id (của lệnh thắng) — không còn tình trạng ghi đè lẫn lộn không rõ ràng. PASS.
2. Thử lại sau khi thua race: gọi lại `gsheetGetOrCreateSheetId()` (mô phỏng người dùng làm theo lời khuyên trong thông báo lỗi, bấm Sao lưu lại) → trả về ĐÚNG id đã thắng trong `localStorage`, KHÔNG tạo thêm Sheet mới (`createCallCount` không tăng) → hội tụ đúng, không tạo rác thêm. PASS.
3. Hồi quy — trường hợp bình thường (không race, chỉ 1 lệnh gọi): xóa `localStorage`, gọi `gsheetGetOrCreateSheetId()` đúng 1 lần → tạo Sheet, ghi `localStorage` bình thường, không bị lỗi race giả (false positive). PASS.
4. Hồi quy chung: 0 lỗi console trong suốt toàn bộ đợt test 7 scenario + fix; chuyển đủ 4 tab (Hôm nay/Chọn bài/Nhập set/Lịch sử) qua `switchScreen()` không lỗi.

## Việc KHÔNG làm (ngoài phạm vi)
Không sửa `SW_A7_v1.js` (bug scenario 4 nằm hoàn toàn ở tầng JS ứng dụng, không phải Service Worker). Không sửa thêm gì ở scenario 1, 2, 3, 5, 6, 7 vì không phát hiện bug nào — code hiện tại đã xử lý đúng.

## ⚠️ Cần user xác nhận lại trên thiết bị thật (sau khi push GitHub Pages)
Vì fix này chỉ thật sự có ý nghĩa kiểm chứng đầy đủ với 2 tab/thiết bị thật cùng lúc (điều kiện race rất hẹp, khó ép buộc 100% ngoài môi trường test có kiểm soát thời gian phản hồi), cần user xác nhận lại trên `https://nguyenkhoiduongtu90.github.io/sogym/SoGym_A7_v3.html`:
1. Dùng bình thường 1 tab như cũ (Sao lưu, Khôi phục) — phải hoạt động y hệt A7_v2, không có gì đổi khác về trải nghiệm thông thường.
2. (Tùy chọn, không bắt buộc vì race rất hẹp) nếu muốn tự kiểm chứng: mở 2 tab cùng app, xóa hết dữ liệu Sổ Gym Backup cũ trên Drive + xóa `sogym_google_sheet_id` khỏi localStorage cả 2 tab, rồi bấm Sao lưu ở cả 2 tab gần như cùng lúc — nếu thấy 1 tab báo lỗi "Một tab/thiết bị khác vừa tạo Google Sheet..." thì đúng như thiết kế, bấm Sao lưu lại ở tab đó là xong.
3. Nếu trình duyệt đã cài `SoGym_A7_v2.html` từ trước, tải lại trang 1 lần trên URL A7_v3 để chắc chắn đang chạy đúng bản mới.
