# QA — SoGym_A7_v5.html — Fix lỗi "Xóa toàn bộ dữ liệu" luôn báo sai + audit toàn bộ nút tab Lịch sử

**Ngày:** 2026-08-21
**File:** `SoGym_A7_v5.html` (copy từ `SoGym_A7_v4.html`, chỉ đổi `<title>`, thêm comment A7_v5, sửa `resetAllData()`)
**SW:** KHÔNG đổi — vẫn dùng `SW_A7_v2.js` (bug lần này thuần JS tầng app, không liên quan Service Worker/cache ảnh)
**Trạng thái:** Đã test thật toàn bộ 8 nút trong tab Lịch sử, PASS hết. Chờ user xác nhận trên thiết bị thật.

## Lý do đợt audit này
User báo lỗi thực tế kèm ảnh chụp màn hình (nguyên văn):
> "V4 vẫn lỗi, khi phát hiện chức năng xóa toàn bộ dự liệu tại tab Lịch sử, báo lỗi như hình tôi up, mặc dù nhập "XÓA" chính xác. ở tab, Lịch sử có khá nhiều nút, mỗi nút 1 chức năng, mỗi nút giá lập 2-4 tình huống có thể xảy ra lỗi, ở cả trường hợp, có mạng và không mạng, sửa chữa nếu có sai sót"

Tức 2 yêu cầu:
1. Sửa lỗi thật: nút "🗑 Xóa toàn bộ dữ liệu" luôn báo "Xác nhận không đúng" dù user gõ đúng "XÓA".
2. Audit chủ động toàn bộ các nút khác trong tab Lịch sử (8 nút), mỗi nút giả lập 2-4 tình huống lỗi thực tế, cả online lẫn offline.

## 1. Root cause lỗi XÓA — xác nhận bằng kiểm tra codepoint Unicode thật, không phải đoán

Trích xuất trực tiếp các codepoint của literal `'XÓA'` trong file JS bằng script Python: xác nhận literal trong source được lưu ở dạng **NFC** (precomposed — chữ "Ó" là 1 mã điểm Unicode duy nhất U+00D3).

Bàn phím tiếng Việt trên nhiều thiết bị (đặc biệt iOS) khi gõ có thể sinh ra ký tự ở dạng **NFD** (decomposed — chữ "O" U+004F + dấu sắc ghép riêng U+0301, 2 mã điểm). Hai dạng này **nhìn giống hệt nhau** trên màn hình nhưng so sánh `!==`/`===` kiểu strict coi là 2 chuỗi khác nhau.

Code cũ so sánh trực tiếp `typed.trim() !== 'XÓA'` — nếu `typed` đến từ bàn phím sinh ra dạng NFD, phép so sánh strict luôn `true` (khác nhau) dù mắt người thấy giống hệt, khiến user gõ đúng vẫn luôn bị từ chối. Đây khớp hoàn toàn với đúng những gì user mô tả và ảnh chụp lỗi.

## 2. Fix áp dụng

`resetAllData()` — chuẩn hoá **cả 2 vế** về cùng 1 dạng Unicode (NFC) trước khi so sánh:
```js
if(typed.trim().normalize('NFC') !== 'XÓA'.normalize('NFC')){
```
Không đổi logic nào khác trong hàm (vẫn giữ nguyên `confirm()` cảnh báo đầu tiên, `prompt()` xác nhận gõ chữ, `localStorage.removeItem()` trong try/catch, `location.reload()`).

## 3. Test thật lỗi XÓA (Claude Preview, gọi trực tiếp hàm thật `resetAllData()`, monkeypatch `confirm`/`prompt`/`alert` để kiểm soát input, không phải suy luận code suông)

| Kịch bản | Input mô phỏng | Kết quả | Đánh giá |
|---|---|---|---|
| Gõ "XÓA" dạng NFD (đúng bug user gặp) | `'X'+'O'+'́'+'A'` | Không bị báo lỗi, dữ liệu bị xóa thành công | ✅ FIX ĐÚNG — đây là bằng chứng trực tiếp lỗi đã hết |
| Gõ "XÓA" dạng NFC (trường hợp thường) | `'XÓA'` | Không bị báo lỗi, xóa thành công | ✅ PASS — không hồi quy |
| Gõ đúng nhưng có khoảng trắng thừa | `'  XÓA  '` | Không bị báo lỗi, xóa thành công (nhờ `.trim()`) | ✅ PASS |
| Gõ sai — thường, không dấu | `'xóa'`, `'XOA'`, `''` | Alert "Xác nhận không đúng — đã hủy thao tác, dữ liệu KHÔNG bị thay đổi.", dữ liệu giữ nguyên | ✅ PASS — vẫn từ chối đúng input sai |
| Hủy hộp thoại `confirm()` đầu tiên | `confirm` trả `false` | Hàm return sớm, không có prompt, không đổi gì | ✅ PASS |
| Hủy hộp thoại `prompt()` (bấm Cancel) | `prompt` trả `null` | Hàm return sớm (im lặng, không alert), không đổi gì — đúng thiết kế | ✅ PASS |
| `localStorage.removeItem()` bị lỗi (mô phỏng quota/storage lỗi) | `Storage.prototype.removeItem` throw lỗi giả | Alert "Xóa dữ liệu thất bại: ...", dữ liệu KHÔNG bị mất, không reload | ✅ PASS — catch hoạt động đúng |

## 4. Audit toàn bộ 8 nút/chức năng còn lại trong tab Lịch sử

Dựng dữ liệu lịch sử giả thực tế (3 buổi tập ở các mốc ngày khác nhau: 1 ngày trước, 10 ngày trước, 40 ngày trước) để test đúng logic lọc/xuất trên dữ liệu thật, không phải mock rỗng.

### a) Chip lọc nhanh (7 ngày / 30 ngày / Tháng này / Tất cả) + khoảng ngày thủ công
- Click từng chip → đúng 1 chip active tại 1 thời điểm, `exportFrom`/`exportTo` set đúng công thức ngày.
- Gọi `filterHistoryByRange()` với giá trị thật lấy từ ô ngày (đúng như `btnExportCsv` làm) → kết quả lọc đúng 100% theo từng mốc: 7 ngày → 1 buổi, 30 ngày → 2 buổi, Tháng này → 2 buổi, Tất cả → 3 buổi.
- Khoảng ngày thủ công **đảo ngược** (from > to) → không crash, trả về mảng rỗng (không có buổi nào thỏa cả 2 điều kiện) — hành vi an toàn, không cần fix.
- **PASS** toàn bộ. (Lưu ý: lần test đầu gọi `filterHistoryByRange()` không truyền tham số cho ra kết quả sai — đó là lỗi ở kịch bản test tự viết, không phải bug app; đã phát hiện và tự sửa lại cách gọi cho khớp đúng cách hàm thật được dùng trong code, sau đó test lại cho kết quả đúng.)

### b) ⇩ Xuất Excel (`btnExportCsv`)
- Khoảng ngày rỗng kết quả (0 buổi) → alert "Không có buổi tập nào trong khoảng ngày đã chọn.", không gọi xuất file. **PASS**
- Thư viện XLSX chưa tải được (mô phỏng offline lúc app mở lần đầu, `typeof XLSX === 'undefined'`) → alert "Không tải được thư viện xuất Excel (cần có Internet lúc xuất)...", return `false`, không crash. **PASS**
- Dữ liệu biên: buổi tập rỗng (0 bài, 0 cardio) lẫn trong danh sách → `buildExportSheets()` không lỗi, vẫn dựng đủ overviewRows/prRows. **PASS**
- Click thật nút Xuất Excel với dữ liệu hợp lệ, XLSX đã tải → chạy hết pipeline `buildExportSheets → book_new → 5 sheet → writeFile` không lỗi, 0 console error. **PASS**

### c) 💾 Sao lưu JSON (`backupJson`)
- Thuần local (Blob + `URL.createObjectURL` + `<a download>`), không gọi mạng → hành vi online/offline giống hệt nhau, không cần phân biệt.
- Gọi thành công bình thường → trả `true`, `state.lastBackupISO` được cập nhật. **PASS**
- Double-click nhanh liên tiếp → không lỗi, không crash. **PASS**
- Mô phỏng `Blob` constructor throw lỗi (edge case môi trường không hỗ trợ) → catch bắt đúng, alert "Sao lưu thất bại: ...", trả `false`. **PASS**

### d) Khôi phục từ file (`restoreFile` input change handler)
Thuần `FileReader` đọc file local, không gọi mạng → online/offline giống hệt nhau.
- File hợp lệ, user bấm Cancel ở `confirm()` → dữ liệu giữ nguyên, input file được clear (đúng fix A6_v2-C cũ vẫn hoạt động). **PASS**
- File hợp lệ, user bấm OK → khôi phục đúng dữ liệu, chạy `runIntegrityCheck()`, về màn Hôm nay, alert "Khôi phục thành công.". **PASS**
- File JSON sai định dạng (malformed) → catch bắt lỗi, alert "File sao lưu bị lỗi, không đọc được: ...". **PASS**
- File JSON hợp lệ nhưng thiếu cờ `_sogym_backup` → alert "File này không phải file sao lưu hợp lệ của Sổ Gym.", không đổi gì. **PASS**
- Cả 4 kịch bản trên đều clear đúng `input.value` sau khi xong (fix A6_v2-B), kể cả nhánh hủy/lỗi. **PASS**

### e) ☁️ Sao lưu lên Google Sheets (`gsheetBackup`) — kịch bản MỚI: offline ngay từ đầu, trước cả khi tải được thư viện Google Identity Services
- Ép script `accounts.google.com/gsi/client` luôn fail load (giả lập mất mạng thật sự từ lần bấm đầu tiên, chưa từng tải GSI trước đó) → promise chain rơi đúng vào `.catch()` của `gsheetBackup()`, alert "Sao lưu lên Google Sheets thất bại: Không tải được thư viện đăng nhập Google. Kiểm tra kết nối mạng rồi thử lại.", nút được bật lại (`disabled=false`), status hiển thị đúng thông báo lỗi. **PASS**

### f) ⬇ Khôi phục từ Google Sheets (`gsheetRestore`) — 2 kịch bản
- Chưa từng Sao lưu lần nào (không có `sogym_google_sheet_id` trong localStorage) → thoát sớm ngay, alert "Chưa có bản sao lưu nào trên Google Sheets. Hãy bấm "Sao lưu lên Google Sheets" trước.", KHÔNG gọi mạng. **PASS**
- Đã từng có sheetId lưu trước đó, nhưng lần bấm Khôi phục này bị offline ngay từ đầu (GSI load fail) → alert "Khôi phục từ Google Sheets thất bại: Không tải được thư viện đăng nhập Google. Kiểm tra kết nối mạng rồi thử lại.", nút bật lại. **PASS**

## 5. Hồi quy chung sau toàn bộ audit
- 0 console error trong suốt cả phiên test (test XÓA + audit 7 nút còn lại).
- Chuyển đủ 4 tab (`home`/`picker`/`log`/`history`) qua `switchScreen()` không lỗi.
- `gsheetGetOrCreateSheetId`, `gsheetBackup`, `gsheetRestore`, `gsheetApplyRestore`, `thumbHTML`, `IMG_BASE` đều còn nguyên vẹn, không bị ảnh hưởng.
- Service Worker vẫn đúng `SW_A7_v2.js` (không đổi, không cần đổi vì bug lần này thuần JS tầng app).

## Việc KHÔNG làm (ngoài phạm vi)
Không đổi `SW_A7_v2.js`/`IMAGE_CACHE_MAX_ENTRIES` (không liên quan bug lần này). Không đổi thuật toán lọc/xuất Excel/backup/restore/GSheet — chỉ audit và xác nhận đang hoạt động đúng, không phát hiện bug nào khác ngoài lỗi XÓA đã fix.

## Giới hạn đã biết
Các kịch bản "offline" ở trên đều mô phỏng bằng cách ép script GSI/thư viện fail load hoặc set biến `typeof XLSX==='undefined'`, KHÔNG phải test ngắt mạng thật 100% (máy bay mode) — tương tự giới hạn đã ghi nhận ở QA A7_v4. Về mặt cấu trúc code, các nhánh lỗi mạng đều có `.onerror`/`.catch()` xử lý rõ ràng nên mô phỏng này đủ tin cậy để xác nhận logic, nhưng user nên tự xác nhận thêm 1 lần trên thiết bị thật khi thực sự tắt mạng.

## ⚠️ Cần user xác nhận lại trên thiết bị thật (sau khi push GitHub Pages)
1. Vào tab Lịch sử, bấm "🗑 Xóa toàn bộ dữ liệu", gõ đúng "XÓA" bằng bàn phím tiếng Việt trên điện thoại thật (đúng cách đã gây lỗi trước đây) → phải xóa thành công, không còn báo "Xác nhận không đúng".
2. Dùng thử các nút còn lại trong tab Lịch sử như bình thường (Xuất Excel, Sao lưu JSON, Khôi phục file, Sao lưu/Khôi phục Google Sheets) — phải hoạt động y hệt A7_v4, không có gì đổi khác.
