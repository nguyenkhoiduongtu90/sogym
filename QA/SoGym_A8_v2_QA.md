# QA — SoGym_A8_v2.html — Sửa ngưỡng hợp lý theo phản hồi user + cho nhập/sửa theo ngày bất kỳ

**Ngày:** 2026-08-22
**File:** `SoGym_A8_v2.html` (copy từ `SoGym_A8_v1.html`, file gốc không sửa — v1 đã báo cáo cho user nên không được edit in-place theo quy tắc dự án)
**SW:** không đổi, vẫn `SW_A7_v2.js`
**Trạng thái:** Đã sửa theo đúng 3 quyết định user chốt qua AskUserQuestion, đã test thật kỹ, PENDING xin phép push GitHub.

## Bối cảnh — phản hồi của user trên bản A8_v1

Sau khi báo cáo A8_v1, user chỉ ra 3 vấn đề:
1. Ngưỡng hợp lý ban đầu (cân nặng 0-1000kg, %mỡ/%cơ 0-100%) **phi logic** — không ai nặng 1000kg hay có 100% mỡ/thịt/nội tạng là 0. Đề xuất: cân nặng max 150kg, %mỡ max 50%.
2. Hỏi rõ: ngưỡng calo 20000kcal là tính theo **1 ngày** hay theo thời gian khác?
3. Đề nghị: form nên cho **nhập/sửa được ngày nào cũng được**, không chỉ hôm nay — và hỏi có xung khắc gì với phần khác của app không.

## Quyết định chốt qua AskUserQuestion (2026-08-22)

Trước khi sửa code, đã hỏi lại 3 câu (đúng tinh thần "không rõ hỏi lại trước khi thực hiện" user yêu cầu):
1. **%Cơ (muscle) tối đa** — không cùng thang đo với %mỡ nên không tự suy ra: user chọn **50%** (giống %mỡ).
2. **Calo/ngày** — xác nhận đúng là tổng calo nạp trong **1 NGÀY** (mỗi lần nhập = tổng ngày đó, không phải tuần/tháng). User chọn ngưỡng mới: **10.000 kcal/ngày**.
3. **Cách cho sửa ngày bất kỳ** — đã kiểm tra code trước khi hỏi, xác nhận **không có xung khắc kỹ thuật**: `findBodyEntry(dateISO)`/`findNutritionEntry(dateISO)` vốn đã nhận tham số ngày bất kỳ, chỉ có form UI đang cố định cứng "hôm nay". User chọn phương án khuyến nghị: **thêm ô chọn ngày ngay trên form**, thay thế luôn kiểu sửa qua 4 lần hộp thoại `prompt()` cũ.

## Thay đổi trong SoGym_A8_v2.html

### 1. Ngưỡng hợp lý (sanity bounds) — trong `btnSaveBody` handler
| Chỉ số | A8_v1 (cũ, phi logic) | A8_v2 (mới, theo user chốt) |
|---|---|---|
| Cân nặng | 0 < w < 1000 kg | 0 < w ≤ **150** kg |
| % Mỡ cơ thể | 0 ≤ f ≤ 100 | 0 ≤ f ≤ **50** |
| % Cơ | 0 ≤ m ≤ 100 | 0 ≤ m ≤ **50** |
| Calo nạp/ngày | 0 ≤ c < 20000 | 0 ≤ c ≤ **10000** |

Comment code cập nhật giải thích rõ đây là kết quả phản hồi thực tế của user, không phải suy đoán.

### 2. Ô chọn ngày trên form + nút "Hôm nay"
- HTML: thêm `<input type="date" id="bodyDateInp">` (có `max` = hôm nay, chặn chọn ngày tương lai qua UI picker) và nút `<button id="btnBodyDateToday">Hôm nay</button>` cạnh nhau trên đầu card "Nhập chỉ số theo ngày" (đổi tên từ "Chỉ số hôm nay").
- Biến module mới `bodyFormDate` (mặc định = hôm nay) theo dõi ngày đang hiển thị/nhập trên form — reset về hôm nay mỗi lần **vào lại tab** Cơ thể (trong `switchScreen()`), nhưng **không** bị reset bởi các lần render nội bộ khác (đổi metric biểu đồ, sync đa-tab qua `storage` listener, sau khi lưu) — tránh giật ngày đang sửa dở về hôm nay ngoài ý muốn.
- Hàm mới `loadBodyFormForDate(d)` — nạp lại toàn bộ form (5 field + màu viền + ẩn hint) cho 1 ngày bất kỳ, dùng chung cho 3 nơi: mở tab, đổi ô chọn ngày (`change` listener), và bấm nút "Hôm nay".
- `btnSaveBody` handler: đọc ngày từ `#bodyDateInp` thay vì `localDateISO()` cứng; thêm 2 guard mới — ngày rỗng ("Vui lòng chọn ngày.") và ngày tương lai ("Không thể nhập chỉ số cho ngày trong tương lai.") — kiểm tra lại ở JS dù input đã có `max` HTML, phòng trường hợp trình duyệt cũ/gõ tay không qua picker.

### 3. Bỏ hẳn kiểu sửa qua 4 lần `prompt()` trong Lịch sử Cơ thể
Nút ✎ trong `renderBodyHistoryList()` không còn hỏi tuần tự 4 hộp thoại `prompt()` nữa — thay bằng: set `bodyFormDate` = ngày đó, gọi `loadBodyFormForDate(d)` để nạp dữ liệu ngày đó lên chính form phía trên, cuộn mượt tới đó (`scrollIntoView`). User sửa trực tiếp trên form rồi bấm "Lưu chỉ số" như bình thường — dùng lại đúng 1 bộ validate/lưu (`btnSaveBody`) thay vì phải duy trì 2 bộ logic dễ lệch nhau (rủi ro đã từng xảy ra ở A5_v2, khi 2 chỗ validate riêng biệt phát sinh ngưỡng khác nhau). Xoá ~40 dòng code cũ, thay bằng ~7 dòng.

## Test thật (Claude Preview MCP, gọi trực tiếp hàm/click nút thật, không chỉ đọc code)

### Ngưỡng hợp lý mới
| Trường hợp | Kỳ vọng | Kết quả |
|---|---|---|
| Đúng biên: 150kg / 50% mỡ / 50% cơ / 10000kcal | Chấp nhận (biên inclusive) | PASS |
| Vượt biên nhẹ: 150.1kg / 50.1% / 50.1% / 10001kcal (cả 4 field) | Từ chối cả 4, viền đỏ đúng field, không lưu gì | PASS |

### Nhập/sửa theo ngày bất kỳ
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Nhập dữ liệu cho 1 ngày quá khứ (2026-08-15) qua ô chọn ngày | Lưu đúng vào `state.body`/`state.nutrition` với `dateISO` đó; dữ liệu hôm nay không bị đụng | PASS |
| Chọn ngày tương lai rồi Lưu | Bị chặn, alert rõ ràng, không lưu | PASS |
| Để trống ngày rồi Lưu | Bị chặn, alert "Vui lòng chọn ngày." | PASS |
| Bấm ✎ ở Lịch sử Cơ thể cho ngày quá khứ | Form nạp đúng 5 giá trị của ngày đó (không còn hỏi prompt) | PASS |
| Sửa 1 field (cân nặng) trên form vừa nạp rồi Lưu | Cập nhật đúng field đó, các field khác (% cơ, calo) giữ nguyên | PASS |
| Xoá cả 3 field cơ thể (giữ trống) rồi Lưu | Xoá `state.body` entry ngày đó, **giữ nguyên độc lập** `state.nutrition` entry cùng ngày | PASS |
| Bấm nút "Hôm nay" sau khi đang ở ngày khác | `bodyFormDate` + ô ngày nhảy về đúng hôm nay | PASS |
| Đổi trực tiếp ô chọn ngày (dispatch `change`) | Form nạp lại đúng dữ liệu ngày mới chọn | PASS |
| Nút 🗑 xoá ở Lịch sử Cơ thể | Vẫn xoá cả `body` lẫn `nutrition` của ngày đó như cũ (không đổi hành vi) | PASS |

### Hồi quy
- Biểu đồ xu hướng: vẽ đúng với dữ liệu 3 ngày (weight), chuyển chip %mỡ/%cơ không lỗi.
- Mục tiêu (`goalGrid`): đặt mục tiêu cân nặng qua `prompt()` vẫn hoạt động đúng (không đổi ở v2).
- Cả 5 tab (Hôm nay/Chọn bài/Nhập set/Lịch sử/Cơ thể) chuyển màn hình sạch qua `switchScreen()`.
- Gọi thật `buildExportSheets()` + `exportXlsx()` (không mock) — sheet "Cơ thể & Dinh dưỡng" vẫn đúng header 6 cột, export chạy trọn vẹn không lỗi.
- **0 console error** trong suốt toàn bộ phiên test (kiểm tra `preview_console_logs` mức `all` sau mỗi nhóm test).

## Giới hạn đã biết
- Vẫn CHƯA test trên thiết bị thật (chỉ sandbox/Claude Preview) — đặc biệt cần kiểm tra input `type="date"` hiển thị đúng bàn phím/UI chọn ngày native trên iOS Safari (khác PC Chromium dùng để test ở đây).
- `<input type="date" max="...">` chặn chọn ngày tương lai qua UI picker của từng trình duyệt — hành vi UI cụ thể (có cho gõ tay vượt max hay tự kẹp) có thể khác nhau giữa các trình duyệt, nhưng đã có guard JS phía sau nên dữ liệu không thể lưu sai trong mọi trường hợp.

## Việc KHÔNG làm
Không đổi SW. Không đổi data model (`state.body`/`state.nutrition`/`state.goals`, `DATA_SCHEMA_VERSION` vẫn giữ 3). Không đổi biểu đồ/mục tiêu/export ngoài việc chúng vẫn hoạt động đúng với cơ chế ngày mới. Không thêm ràng buộc ngày tối thiểu (min) — cho phép nhập dữ liệu quá khứ xa tuỳ ý, vì hợp lý với nhu cầu "bổ sung dữ liệu cũ từ trước khi dùng app".

## Cần user xác nhận
1. Test thật trên điện thoại: vào tab Cơ thể, thử nhập ngày hôm nay + 1 ngày quá khứ qua ô chọn ngày, thử sửa 1 entry cũ qua nút ✎ (giờ mở lại form thay vì hỏi 4 lần).
2. Ngưỡng mới (150kg / 50% / 50% / 10000kcal) và việc bỏ giới hạn ngày tối thiểu có ổn không.
3. Xác nhận cho push lên GitHub (SW không đổi, không cần bump).
