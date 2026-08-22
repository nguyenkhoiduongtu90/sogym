# QA — SoGym_A9_v1.html — Modal tự thiết kế thay cho alert()/confirm()/prompt() gốc trình duyệt

**Ngày:** 2026-08-22
**File:** `SoGym_A9_v1.html` (copy từ `SoGym_A8_v4.html` — bước A9 mới, KHÔNG phải bugfix của A8, xem lý do ở mục "Vì sao là A9 chứ không phải A8_v5" bên dưới)
**SW:** không đổi, vẫn `SW_A7_v2.js`
**Trạng thái:** Đã implement đầy đủ + test thật kỹ qua Claude Preview MCP (DOM thật, không mock), PENDING xin phép push GitHub.

## Bối cảnh
Trong lúc user test `SoGym_A8_v4.html` thật trên iPhone, user gửi 1 tin nhắn gồm 2 việc:
1. Viết lại prompt vẽ hình cho tab Cơ thể, tách rõ phần "copy cho AI thiết kế" và phần "diễn giải cho user, không copy" (đã làm ở `pics/SoGym_Prompt_VeHinh.md` mục 9).
2. Chụp ảnh gửi kèm 1 hộp thoại `confirm()` nền trắng của trình duyệt (khi bấm "Kết thúc buổi tập" lúc chưa có bài nào), nói muốn các bảng thông báo kiểu này mang phong cách chung của app, và **tất cả bảng tương tự trong app** cũng nên đồng bộ.

Sau khi điều tra, xác nhận việc #2 **không thể** giải quyết bằng ảnh/CSS — `alert()`/`confirm()`/`prompt()` là UI cấp trình duyệt/OS, nằm ngoài sandbox CSS của trang, không cách nào restyle được. Đã báo cho user (mục 10 trong file prompt vẽ hình) rằng đây là việc code, không phải việc vẽ ảnh, và hỏi thời điểm làm. User trả lời: **"Làm ngay, thành 1 bước riêng"**.

## Vì sao là A9 chứ không phải A8_v5
Theo tiền lệ đặt tên đã dùng trong dự án (A4→A8 = mốc tính năng lớn, `_v#` = bugfix trong nội bộ 1 mốc), việc thay toàn bộ hệ thống hộp thoại gốc bằng 1 hệ thống modal tự viết là **hạ tầng UI xuyên suốt cả app** (ảnh hưởng ~38 điểm gọi trên toàn bộ file, không riêng gì tab Cơ thể của A8) — không phải một lỗi/thiếu sót cụ thể của tính năng A8. Vì vậy đặt tên bước mới **A9**, không phải `A8_v5`.

## Thiết kế

### Vì sao dùng `async`/`await` thay vì callback
`alert()`/`confirm()`/`prompt()` gốc là đồng bộ (block code tới khi user bấm), còn modal tự viết chỉ có thể bất đồng bộ (chờ user click). Có 2 cách chuyển: callback lồng nhau, hoặc Promise + `async`/`await`. Chọn `async/await` vì gần như không phải viết lại logic tuyến tính đã có (chỉ thêm `async` trước `function(){` và `await` trước lời gọi) — trong khi callback sẽ phải bẻ lại cấu trúc của các đoạn có nhiều bước nối tiếp (vd 2 `prompt()` liên tiếp khi sửa Reps/Tạ, hoặc chuỗi `confirm()`→`prompt()` của `resetAllData()`). iOS Safari đã hỗ trợ `async/await` từ 2017, không phải rủi ro tương thích với thiết bị mục tiêu của app.

### Giữ nguyên "hợp đồng" trả về của hàm gốc
- `showAppPrompt()` trả `null` khi Huỷ (giống `prompt()` gốc phân biệt null vs chuỗi rỗng — code cũ có chỗ dựa vào `if(input===null) return;` trong khi vẫn cho phép chuỗi rỗng đi tiếp, vd "để trống để xoá mục tiêu").
- `showAppConfirm()` trả `boolean` (`true`/`false`).
- `showAppAlert()` trả `undefined` (resolve không giá trị).

Nhờ vậy hầu hết chỗ gọi chỉ cần đổi `alert(x)` → `await showAppAlert(x)`, `confirm(x)` → `await showAppConfirm(x)`, `prompt(x,y)` → `await showAppPrompt(x,y)`, không phải sửa logic xung quanh.

### Tái dùng token màu sẵn có, không bịa bảng màu mới
`--surface` (nền modal, giống `.card`), `--accent`/`--accent-text` (nút OK thường), `--warn` (nút OK kiểu nguy hiểm cho thao tác phá huỷ như xoá/reset — dùng `{danger:true}`), `--border`, `--radius`, `--text`. Overlay mô phỏng đúng pattern `#splashScreen{position:fixed; inset:0;...}` đã có sẵn trong code, z-index:1000 (cao hơn `#splashScreen` là 999) để modal không bao giờ bị che dù gọi ngay lúc khởi động app.

### 1 khung DOM dùng chung cho cả 3 loại
`#appModalOverlay` > `.app-modal` chứa `#appModalMessage`, `#appModalInput` (chỉ hiện khi `type:'prompt'`), `#appModalCancel` (ẩn khi `type:'alert'`), `#appModalOk`. Hàm lõi `openAppModal(opts)` trả về 1 Promise; `showAppAlert`/`showAppConfirm`/`showAppPrompt` là 3 wrapper gọi `openAppModal` với `type` khác nhau.

### Tương tác hỗ trợ
Bấm OK, bấm Huỷ, bấm ra ngoài overlay (click ngoài `.app-modal`), phím Escape (= Huỷ), phím Enter (chỉ với `type:'prompt'`, = OK — không tác dụng với alert/confirm để tránh bấm nhầm khi đang gõ liên tục).

## Phạm vi sửa — 38 điểm gọi trên toàn file
Đã thay **toàn bộ** `alert()`/`confirm()`/`prompt()` gốc trong `SoGym_A9_v1.html`, không sót điểm nào (xác nhận bằng grep sau khi sửa xong — 0 lời gọi thật còn lại, chỉ còn các dòng comment nhắc lại lịch sử cũ):

| Khu vực | Nội dung |
|---|---|
| `btnEndSession` | 1 confirm (kết thúc buổi rỗng) |
| `renderSetRows()` — sửa/xoá set khi đang tập | 2 prompt nối tiếp (Reps, Tạ) + 1 alert (giá trị sai) + 1 confirm (xoá set) |
| `renderHistory()` — sửa/xoá set trong Lịch sử | 1 confirm (xoá buổi) + 2 prompt nối tiếp + 1 alert + 1 confirm (xoá set) |
| `renderGoalGrid()` | 1 prompt (đặt mục tiêu) + 1 alert (vượt ngưỡng) — xác nhận chạy đúng 1 lần/lượt bấm, không phải 4 lần |
| `renderBodyHistoryList()` | 1 confirm (xoá bản ghi cơ thể) |
| `btnSaveBody` | 2 alert (thiếu ngày, ngày tương lai) |
| `exportXlsx()` / `btnExportCsv` | 2 alert (thiếu thư viện, lỗi xuất) + 1 alert (không có buổi trong khoảng ngày) |
| `backupJson()` | 1 alert (sao lưu thất bại) |
| `restoreFile` change handler | 2 alert (file sai cấu trúc) + 1 confirm (xác nhận thay thế dữ liệu) + 1 alert (thành công) + 1 alert (lỗi đọc file) |
| `gsheetBackup()` / `gsheetRestore()` | 4 alert (kết quả sao lưu/khôi phục Google Sheets) — cố ý KHÔNG `await` vì không có logic nào phụ thuộc việc đóng modal trước khi `.finally()` bật lại nút |
| `gsheetApplyRestore()` | 2 alert + 1 confirm + 1 alert (thành công) + 1 alert (lỗi) |
| `resetAllData()` | 1 confirm (cảnh báo, `danger:true`) + 1 prompt (gõ "XÓA") + 2 alert (sai xác nhận, xoá thất bại) |

## Lỗi phát hiện qua test thật — đã sửa trước khi báo cáo
Khi test bằng Claude Preview MCP (gọi thật `showAppConfirm()`, bấm thật nút OK qua DOM), phát hiện **`doOk()` trả về `undefined` thay vì `true`** cho loại `confirm` — nghĩa là mọi `if(await showAppConfirm(...))` sẽ LUÔN vào nhánh false dù user bấm OK, coi như luôn bị huỷ. Đây là lỗi thật trong logic gốc lúc viết (không phải lỗi copy/paste), nếu không test thật bằng cách bấm nút thì rất dễ lọt qua vì bề ngoài modal vẫn hiện đúng, chỉ giá trị trả về sai.

Đã sửa: `var val = isPrompt ? inputEl.value : (isAlert ? undefined : true);` — giờ `confirm` trả `true` khi OK, `false` khi Huỷ/Esc/click ngoài; `alert` luôn trả `undefined`; `prompt` trả giá trị ô nhập.

## Test thật (Claude Preview MCP, DOM thật — không mock)

### Engine modal (`openAppModal`/`showApp*`)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| `showAppAlert()`: hiện đúng message, ẩn Huỷ, ẩn input, nút OK `.btn-accent` | Đúng | PASS |
| `showAppConfirm()`: hiện Huỷ, ẩn input | Đúng | PASS |
| `showAppConfirm()` bấm OK → resolve | `true` (boolean) | PASS (sau khi sửa lỗi trên) |
| `showAppConfirm()` bấm Huỷ → resolve | `false` | PASS |
| `showAppPrompt()`: hiện input với giá trị mặc định, tự focus + select | Đúng | PASS |
| `showAppPrompt()` bấm OK → resolve | Chuỗi user gõ | PASS |
| `showAppPrompt()` bấm Huỷ → resolve | `null` | PASS |
| Click ra ngoài overlay (ngoài `.app-modal`) | Coi như Huỷ | PASS |
| Phím Escape | Coi như Huỷ (mọi loại) | PASS |
| Phím Enter khi đang mở prompt | Coi như bấm OK | PASS |
| Phím Enter khi đang mở confirm | KHÔNG có tác dụng (modal vẫn mở) | PASS |
| `{danger:true}` → nút OK đổi `.btn-warn` (đỏ) | Đúng | PASS |
| Ảnh chụp modal thật (mobile 375×812) | Nền tối đúng theme app, không còn nền trắng | PASS |

### `resetAllData()` — mức ưu tiên cao nhất (lịch sử 3 lần lỗi ở A7_v5/v6/v7)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Bấm Huỷ ở confirm cảnh báo đầu tiên | Dừng ngay, dữ liệu không đổi | PASS |
| Confirm cảnh báo hiện đúng nút `.btn-warn` (đỏ) nhờ `danger:true` | Đúng | PASS |
| Qua confirm, gõ sai chữ xác nhận ("nope") | Alert "Xác nhận không đúng", dữ liệu không đổi | PASS |
| Qua confirm, gõ đúng "xoa" (thường, không dấu — đúng logic `normalizeVi()` đã fix ở A7_v7) | Xoá `localStorage`, `location.reload()` thành công | PASS |
| Toàn bộ luồng qua `#appModalInput` (không phải `prompt()` gốc) | Không phá vỡ `normalizeConfirmText()`/`normalizeVi()` | PASS — logic giữ nguyên, chỉ đổi nguồn input |

### `restoreFile` change handler — mức ưu tiên cao (có `finally{}` fix B từ A6_v2)
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Chọn file backup hợp lệ (mô phỏng qua `DataTransfer`), bấm Huỷ ở confirm "sẽ THAY THẾ..." | Dừng, dữ liệu không đổi, `#restoreFile.value` được xoá về `''` (fix B vẫn chạy dù Huỷ) | PASS |
| Chọn lại file, bấm OK, nhưng dữ liệu test có cấu trúc session gây lỗi giữa chừng (exception thật, không cố ý) | `catch{}` bắt được, hiện alert lỗi, và `finally{}` VẪN xoá `#restoreFile.value` | PASS — xác nhận `finally{}` chạy trên mọi nhánh thoát, kể cả exception ngoài dự kiến |

### Spot-check các điểm còn lại
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| `btnEndSession` khi buổi tập rỗng | Hiện đúng confirm y hệt ảnh chụp màn hình user gửi, giờ theme tối; bấm OK kết thúc đúng | PASS |
| `renderGoalGrid()` đặt mục tiêu cân nặng = 999 (vượt 150kg) | prompt → alert vượt ngưỡng, không lưu | PASS |
| `renderSetRows()` sửa set: 2 prompt nối tiếp (Reps→Tạ), có giá trị mặc định đúng set đang sửa | Lưu đúng `reps`/`weight`/`rm` mới, re-render đúng | PASS |
| `renderSetRows()` xoá set | confirm đúng nội dung "Xoá set #N...", xoá đúng phần tử | PASS |

### Hồi quy chung
| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| Tải trang lần đầu, mọi lần reload sau các test | 0 console error trong suốt phiên test | PASS |
| Cú pháp toàn bộ `<script>` (parse qua `new Function()` không khả dụng do máy không có Node — thay bằng tải thật trong Claude Preview + kiểm tra console) | Không lỗi cú pháp | PASS |

Dữ liệu test dùng `localStorage` cô lập trong Claude Preview (không phải dữ liệu thật của user), đã `localStorage.clear()` dọn sạch sau khi test xong.

## Việc KHÔNG làm
Không đổi SW. Không đổi data model/`DATA_SCHEMA_VERSION` (vẫn 3). Không đổi bất kỳ nội dung câu chữ nào của các thông báo gốc — chỉ đổi CÁCH hiển thị, giữ nguyên 100% nội dung tiếng Việt đã có. Không đổi ngưỡng/logic nghiệp vụ nào (bounds cơ thể, xác nhận XÓA...) — chỉ đổi nguồn input từ hộp thoại trình duyệt sang modal tự viết.

## Giới hạn đã biết — cần user xác nhận trên iPhone thật
1. Hành vi focus/bàn phím ảo (virtual keyboard) của ô input trong modal `prompt` — Claude Preview MCP chạy trên Chromium desktop, không mô phỏng đầy đủ hành vi Safari iOS (vd bàn phím che modal, animation focus). Đây là giới hạn đã biết, cùng loại với giới hạn đã công bố ở A7/A8.
2. Xem toàn bộ modal (đặc biệt `resetAllData()` và `restoreFile`) trên màn hình nhỏ thật để chắc chắn không bị tràn/che bởi bàn phím ảo.
3. Xác nhận phong cách modal (màu, bo góc, nút) đã đúng ý muốn "mang phong cách của cả app" hay cần chỉnh thêm.
4. Xác nhận cho push lên GitHub (SW không đổi, không cần bump) — bản sẽ thay thế `SoGym_A8_v4.html` đang live.
