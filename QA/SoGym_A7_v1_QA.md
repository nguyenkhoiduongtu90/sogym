# QA — SoGym_A7_v1.html — Sao lưu / Khôi phục Google Sheets

**Ngày:** 2026-08-21
**File:** `SoGym_A7_v1.html` (copy từ baseline đã xác nhận `SoGym_A6_v2.html`, chưa chỉnh sửa gì khác)
**SW:** không đổi — vẫn dùng `SW_A4_5_v1.js`
**Trạng thái:** PENDING — chờ user xác nhận "A7_v1 OK" (bao gồm cả xác nhận thật với tài khoản Google thật, xem mục "Giới hạn kiểm thử" bên dưới).

## Thiết kế đã chốt với user (AskUserQuestion, 2026-08-21)
- OAuth flow: Google Identity Services **Token Client** (popup, KHÔNG cần khai báo Authorized redirect URI).
- Client ID dùng: `691408830119-ajrt33vnh55ger02qdddioji8bbtds9i.apps.googleusercontent.com` (đã tạo sẵn ở bước chuẩn bị A7 trước đó).
- Scope: `https://www.googleapis.com/auth/spreadsheets`.
- Định dạng dữ liệu: 1 sheet ("Backups"), 2 cột (Timestamp, JSON thô) — giống hệt payload của `backupJson()` hiện có.
- Nguồn Sheet: app **tự tạo** 1 Google Sheet riêng ("Sổ Gym Backup") ở lần Sao lưu đầu tiên, lưu `spreadsheetId` vào 1 localStorage key riêng (`sogym_google_sheet_id`), KHÔNG nằm trong payload backup.
- Mỗi lần Sao lưu = **append 1 dòng mới** (giữ lịch sử nhiều bản), không ghi đè.
- Cả Backup và Restore đều làm trong A7_v1 (không tách riêng).

## Vị trí trong code
- HTML: card mới `#gsheetCard` trong tab Lịch sử, sau card Sao lưu/Khôi phục/Xóa hiện có.
- JS: khối `A7_v1` chèn giữa listener `#restoreFile` và `resetAllData()` (cùng khu vực code Sao lưu/Khôi phục cũ).
- `switchScreen()`: thêm nhánh reset-on-navigate-away cho `#gsheetRestoreList` khi rời tab Lịch sử (theo đúng checklist "panel tạm thời phải có nút hủy + tự reset" đã đúc kết từ A4.5).

## Phương pháp kiểm thử
Dùng Claude Preview MCP (Chromium thật) trên `SoGym_A7_v1.html` phục vụ qua static server (`python -m http.server`). Vì **không thể hoàn tất đăng nhập Google thật trong môi trường này** (xem mục Giới hạn bên dưới), toàn bộ luồng OAuth + Sheets API được kiểm thử bằng cách **mock `window.google.accounts.oauth2` và `window.fetch`** ngay trong trang thật đang chạy — tức là chạy THẬT code `gsheetBackup()/gsheetRestore()/gsheetApplyRestore()/gsheetApiFetch()` của app, chỉ giả lập phản hồi ở lớp mạng/đăng nhập, không phải đọc code rồi đoán.

## Kết quả — luồng chính (happy path)
1. **Sao lưu lần đầu** (chưa có `sogym_google_sheet_id`): gọi đúng thứ tự `POST spreadsheets` (tạo Sheet) → `POST .../values/Backups!A:B:append`, lưu đúng `spreadsheetId`, cập nhật `lastBackupISO`, trạng thái/alert đúng. PASS.
2. **Sao lưu lần 2** (đã có sheetId): chỉ gọi `append`, KHÔNG gọi lại tạo Sheet. PASS.
3. **Khôi phục — danh sách nhiều bản**: 2 dòng test với timestamp khác nhau → hiển thị đúng thứ tự MỚI NHẤT LÊN ĐẦU. PASS.
4. **Khôi phục — áp dụng dữ liệu thật** (payload đúng cấu trúc `{dateISO,buoi,startedAtText,exercises,cardio}` như `archiveCurrentSessionToHistory()` tạo ra): chọn đúng dòng, `confirm()` hiện đúng timestamp, dữ liệu được thay thế đúng, `currentLogIndex`→-1, `pickerSelectedId`→null, `switchScreen('home')`, danh sách tự ẩn, alert thành công. PASS — tái sử dụng đúng nguyên logic áp dụng dữ liệu + 3 fix A6_v2 (A/B/C) của Restore-từ-file.
5. **Hủy ở hộp `confirm()` khi khôi phục**: dữ liệu KHÔNG bị thay đổi, danh sách vẫn hiện để chọn lại. PASS.
6. **Reset-on-navigate-away**: đang hiện danh sách chọn bản khôi phục, chuyển sang tab khác → danh sách tự ẩn + xóa trắng; quay lại tab Lịch sử là danh sách sạch. PASS.

## Kết quả — 🎯 5 kịch bản lỗi bắt buộc (bước A7 được gắn cờ)
1. **Người dùng đóng popup đăng nhập Google giữa chừng** (`error_callback popup_closed`): báo lỗi rõ ràng bằng tiếng Việt, nút Sao lưu tự bật lại, không có dữ liệu/con trỏ Sheet nào bị thay đổi. PASS.
2. **Trình duyệt chặn popup đăng nhập** (`popup_failed_to_open`): báo lỗi rõ ràng kèm hướng dẫn cho phép popup, không crash. PASS.
3. **Lỗi mạng khi đang ghi lên Google Sheets** (`fetch` reject giữa chừng ở bước append): báo lỗi rõ ràng, nút tự bật lại, không mất/hỏng dữ liệu local. PASS.
4. **Token hết hạn giữa chừng (HTTP 401)**: `gsheetApiFetch()` tự xin token mới và thử lại ĐÚNG 1 LẦN — verify bằng cách bắt request đầu dùng token cũ (401), request thứ 2 dùng token mới (200), chỉ 1 lần gọi lại xin token (không lặp vô hạn). PASS.
5. **Sheet đã lưu trước đó bị xóa/đổi ở ngoài app (HTTP 404)**: tự động xóa con trỏ `sogym_google_sheet_id` khỏi localStorage + báo lỗi rõ ràng hướng dẫn bấm lại để tạo Sheet mới (không âm thầm tạo Sheet thứ 2 ngay trong cùng lần gọi). Test riêng cho cả nhánh Sao lưu. PASS.

Ngoài 5 kịch bản bắt buộc, còn test thêm cho luồng Khôi phục: chưa từng có Sheet nào (PASS), có Sheet nhưng chưa có dòng backup nào (PASS).

## Phát hiện phụ trong lúc test (đã root-cause, KHÔNG sửa code — giải thích tại sao)
Lần đầu test luồng Khôi phục, tôi dùng dữ liệu test tự tạo tối giản (chỉ có `{id:'NEW_SESSION'}`, thiếu field `dateISO`) — khi áp dụng, `saveState()` chạy thành công (dữ liệu ĐÃ lưu đúng), nhưng bước render tiếp theo (`renderHistory()`, dòng có `sess.dateISO.split('-')`) crash vì thiếu `dateISO`, khiến hiện alert lỗi "Dữ liệu bản sao lưu bị lỗi" — dù dữ liệu thực ra đã lưu thành công. Đã xác minh qua code: mọi session do chính app tạo ra (`archiveCurrentSessionToHistory()`, dòng ~950) LUÔN gán `dateISO` (fallback `localDateISO()` nếu thiếu, không bao giờ để trống) — nên **backup thật (dù xuất ra file JSON hay ghi lên Google Sheets) không bao giờ thiếu field này**. Đây là lỗi do dữ liệu test tự tạo không thực tế, KHÔNG phải bug sản phẩm — cùng loại phát hiện với "test-data artifact" đã ghi nhận ở `QA/SoGym_A6_v2_QA.md` (thiếu field `rm` trong set giả). Quan trọng hơn: logic áp dụng dữ liệu của `gsheetApplyRestore()` là bản sao y hệt của Restore-từ-file (đã xác nhận OK ở A6), nên rủi ro này (nếu ai đó tự tay chỉnh sửa JSON backup sai định dạng trước khi khôi phục) đã tồn tại sẵn, ngang nhau ở cả 2 đường Restore, không phải rủi ro MỚI do A7 gây ra — không thuộc phạm vi sửa của A7. Sau phát hiện này đã dọn sạch state test (`localStorage.clear()` + tải lại trang) trước khi tiếp tục.

## Hồi quy (regression)
Sau khi test xong, tải lại trang sạch (`localStorage.clear()`), kiểm tra: 0 lỗi console; điều hướng qua đủ 4 tab (Hôm nay/Chọn bài/Nhập set/Lịch sử) không lỗi; các hàm A6 (`backupJson`, `resetAllData`, `runIntegrityCheck`) và các hàm lõi (`switchScreen`, `renderHome`, `renderHistory`) vẫn tồn tại/hoạt động bình thường, các nút cũ (`#btnBackupJson`, `#btnResetAllData`) vẫn có mặt và gắn đúng listener.

## ⚠️ GIỚI HẠN KIỂM THỬ QUAN TRỌNG — cần user tự xác nhận trên thiết bị thật
Môi trường Claude Preview chạy trên `http://localhost:8934`, KHÔNG phải origin đã đăng ký trong Google Cloud Console (`https://nguyenkhoiduongtu90.github.io`) — nên **popup đăng nhập Google thật KHÔNG THỂ hoàn tất trong môi trường này** (Google sẽ báo lỗi origin không hợp lệ). Toàn bộ phần OAuth/Sheets API ở trên chỉ được test bằng mock (chạy code thật, giả lập phản hồi mạng) — đây là giới hạn khách quan, không phải bỏ sót.

**Cần user tự làm những việc sau trên `https://nguyenkhoiduongtu90.github.io/sogym/SoGym_A7_v1.html` (sau khi được push lên GitHub Pages) để xác nhận thật:**
1. Bấm "☁️ Sao lưu lên Google Sheets" → đăng nhập Google thật (tài khoản test user đã thêm: mail 99 hoặc mail 90) → xác nhận Google Sheet mới "Sổ Gym Backup" được tạo trong Drive, có đúng 1 dòng dữ liệu.
2. Bấm lại lần 2 → xác nhận Sheet có thêm 1 dòng mới (không ghi đè dòng cũ).
3. Bấm "⬇ Khôi phục từ Google Sheets" → xác nhận danh sách hiện đúng các bản đã sao lưu, chọn 1 bản → xác nhận khôi phục đúng.
4. (Tùy chọn) Vào Google Sheet xem trực tiếp — xác nhận cột A/B đúng Timestamp/JSON như mong đợi, đọc được bằng mắt thường.
