# SoGym_A8_v1 — QA Report

**File:** `SoGym_A8_v1.html` (copy từ `SoGym_A7_v7.html`, đã được user xác nhận OK trên thiết bị thật trước khi copy).
**SW:** không đổi, vẫn `SW_A7_v2.js` (kiểm tra lại: SW dùng runtime caching chung, không hardcode tên file HTML/danh sách precache theo bước — không có gì cần bump khi đổi tên file).
**Bước roadmap:** A8 — Nutrition / Body Data (🎯 flagged, bắt buộc mô phỏng thất bại 3-5 tình huống vì đây là domain dữ liệu mới ghi vào chung Data Layer/schema đang dùng).

## Scope đã chốt với user (qua AskUserQuestion trước khi code)
4 quyết định:
1. Gộp chung 1 tab "Cơ thể" (không tách riêng tab Dinh dưỡng/Cơ thể).
2. Theo dõi calo đơn giản dạng **tổng calo nạp/ngày** (không log chi tiết từng món ăn/macro).
3. Xây **biểu đồ đường bằng canvas** ngay trong bản này (không hoãn sang bước sau).
4. Mục tiêu (goals) là **1 giá trị hiện tại/metric, không có deadline, không lưu lịch sử mục tiêu cũ**.

## Thiết kế dữ liệu
Tận dụng nguyên vẹn 3 mảng `state.body`/`state.nutrition`/`state.goals` đã có sẵn từ A2 (khi đó mới chỉ chuẩn bị schema trống, chưa có UI) — A8 là bước đầu tiên có UI thật.

- `state.body[]`: `{ id, dateISO, weight, bodyFat, muscle, note }`
- `state.nutrition[]`: `{ id, dateISO, calories }`
- `state.goals[]`: `{ type: 'weight'|'bodyFat'|'muscle'|'calories', target }`

**Quy ước 1 dòng/ngày, chỉ nhập được cho HÔM NAY** qua form chính (giống quy ước `sessionDateISO` = hôm nay của buổi tập) — sửa ngày quá khứ thì sửa qua danh sách "Lịch sử Cơ thể" (theo đúng pattern edit/delete của `renderHistory()`). Form tự **upsert theo `dateISO`**: nếu hôm nay đã có dữ liệu, form tự nạp lại để sửa tiếp, không tạo dòng trùng.

`state.body` và `state.nutrition` vẫn là 2 mảng **tách riêng** đúng schema A2 gốc — chỉ **gộp lúc render** (`mergedBodyDates()`) để hiển thị 1 dòng lịch sử/ngày; ghi xuống localStorage vẫn đúng 2 mảng độc lập như cũ.

**Quyết định về `DATA_SCHEMA_VERSION`:** **giữ nguyên = 3, không bump.** Lý do: cấu trúc cấp cao (2 mảng `body`/`nutrition` + `goals`) không đổi — `migrateData()` đã đảm bảo chúng là Array từ A2; A8 chỉ là lần đầu ghi field cụ thể bên trong từng phần tử của mảng. Dữ liệu cũ (mảng rỗng, mọi user hiện có) tương thích ngay, không cần thêm bước migrate nào. `saveState()`/`loadState()` đã tự đọc/ghi 3 mảng này từ A2, không phải sửa gì thêm ở Data Layer.

## Các phần đã thêm
- CSS: `.nav-icon-emoji` (tái dùng opacity active/inactive có sẵn của `.nav-icon`).
- Nav bar: nút tab thứ 5 "Cơ thể" dùng icon emoji ⚖️ thay ảnh base64 (chưa có icon vẽ riêng — đúng tiền lệ đã dùng cho nút 🗑/☁️/⬇, xem `pics/SoGym_Prompt_VeHinh.md` mục 5). Layout tự dãn đều nhờ `.nav-item{flex:1}` có sẵn, không phải sửa CSS layout.
- `screen-body`: card "Chỉ số hôm nay" (form 4 ô số + ghi chú), card "Mục tiêu" (lưới 4 ô bấm-để-đặt/sửa qua `prompt()`), card "Xu hướng" (canvas chart + 3 chip chọn metric), card "Lịch sử Cơ thể" (danh sách gộp theo ngày, có ✎/🗑).
- JS: `findBodyEntry/findNutritionEntry/latestBodyEntry/latestNutritionEntry/getGoal/setGoal/mergedBodyDates/renderBodyScreen/renderGoalGrid/renderBodyChart/renderBodyHistoryList` + handler `btnSaveBody` + chip metric handlers.
- `switchScreen()`: thêm nhánh `if(name==='body'){ renderBodyScreen(); }`.
- `NUMERIC_ONLY_IDS`: thêm `bodyWeightInp/bodyFatInp/bodyMuscleInp` (cho phép thập phân), `nutriCalInp` (chỉ số nguyên).
- Đa tab (`storage` listener): thêm re-render `renderBodyScreen()` nếu tab Cơ thể đang mở khi tab khác ghi dữ liệu.
- Excel export: thêm `buildBodySheetRows()` + sheet mới **"Cơ thể & Dinh dưỡng"** vào `buildExportSheets()`/`exportXlsx()`, lọc theo cùng khoảng ngày `fromStr/toStr` như các sheet buổi tập khác.

## Quyết định thiết kế đáng chú ý khác
- **Biểu đồ chỉ có 3 metric weight/bodyFat/muscle** (không có calo) — đúng theo phạm vi đã chốt: calo chỉ theo dõi dạng tổng số/ngày, không phải biểu đồ dinh dưỡng chi tiết.
- **Biểu đồ yêu cầu ≥2 điểm dữ liệu** của đúng metric đang chọn mới vẽ được; ít hơn thì hiện hint thay vì vẽ đường/1 điểm gây hiểu nhầm xu hướng.
- **Sanity bound tự chọn** để chặn số gõ nhầm (không phải giới hạn nghiệp vụ cứng, user có thể yêu cầu đổi nếu thấy chưa hợp): cân nặng 0–1000kg, %mỡ/%cơ 0–100, calo 0–20000kcal/ngày.
- **Form "Chỉ số hôm nay" là form thường trực, không phải panel bật/tắt kiểu toggle/modal** (khác `cardioForm`/`addCustomCard`) — nên **không cần** áp dụng checklist "phải có nút Hủy + auto-reset khi rời tab" của các bug lớp đó; đã cân nhắc chủ động, không phải bỏ sót.
- Sửa 1 dòng lịch sử dùng chuỗi 4 `prompt()` liên tiếp (cân nặng → %mỡ → %cơ → calo), giống hệt pattern `edit-set-btn` (2 `prompt()` liên tiếp) đã có sẵn trong app — chấp nhận UX hơi dài nhưng nhất quán với phần còn lại của app, không phát minh pattern mới.

## Real-browser tests (Claude Preview MCP, server `sogym-static`, cổng 8934)

### Khởi tạo & hiển thị
| Test | Kết quả |
|---|---|
| Load lần đầu (localStorage sạch) | 0 console error, splash ẩn đúng, tab "Cơ thể" hiện đúng icon ⚖️ ở navbar |
| Bấm tab Cơ thể | Hiện đúng form trống + lưới mục tiêu (`— / —` cho cả 4 ô) + hint "cần ít nhất 2 ngày..." ở biểu đồ + "Chưa có dữ liệu Cơ thể nào" ở lịch sử |

### CRUD chính
| Test | Kết quả |
|---|---|
| Nhập đủ 4 ô + ghi chú, bấm Lưu | Lưu đúng vào `state.body`/`state.nutrition` (verify trực tiếp qua state), form giữ nguyên giá trị vừa lưu (đúng thiết kế upsert-hôm-nay) |
| Reload trang sau khi lưu | Dữ liệu đọc lại đúng nguyên vẹn qua `loadState()`/`migrateData()`, không lỗi console — round-trip qua Data Layer OK |
| Đặt mục tiêu (prompt nhập số) | Lưới mục tiêu cập nhật đúng `hiện tại / mục tiêu` |
| Bấm mục tiêu, để trống prompt | Xoá đúng mục tiêu đó (`getGoal()` trả `undefined`), không xoá 3 mục tiêu còn lại |
| Sửa 1 dòng lịch sử (chuỗi 4 prompt giá trị mới hợp lệ) | Cập nhật đúng cả 2 mảng `body`/`nutrition` cho đúng ngày đó |
| Xoá 1 dòng lịch sử qua nút 🗑 (có `confirm()`) | Xoá đúng cả entry `body` lẫn `nutrition` của ngày đó |

### Biểu đồ (canvas)
| Test | Kết quả |
|---|---|
| 3 điểm dữ liệu (weight) | Vẽ đúng đường nối 3 điểm, nhãn max/min, nhãn ngày đầu/cuối, không lỗi console |
| Chuyển chip metric sang % Mỡ | Vẽ lại đúng theo dữ liệu `bodyFat`, chip active đổi đúng |
| Chuyển sang metric chỉ có <2 điểm | Không crash — hiện đúng hint "cần ít nhất 2 ngày...", canvas được `clearRect` sạch |

## 🎯 Mô phỏng thất bại (7 kịch bản — vượt mức tối thiểu 3-5 theo yêu cầu roadmap)

| # | Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|---|
| A | Bấm Lưu khi form trống hoàn toàn (không ô nào, không ghi chú) | Từ chối lưu, hiện hint, dữ liệu không đổi | PASS — `state.body`/`state.nutrition` length không đổi, hint hiện |
| B | Nhập giá trị vô lý cùng lúc: cân nặng âm, %mỡ=150, %cơ="abc", calo=9999999 | Cả 4 ô viền đỏ cảnh báo, từ chối lưu toàn bộ (không lưu 1 phần) | PASS — 4/4 ô đúng viền cảnh báo, `state.body` không đổi |
| C | Xoá tuần tự toàn bộ dòng lịch sử qua nút 🗑 (kể cả bấm nút đã "cũ"/tham chiếu DOM đã render lại ở giữa chừng) | Không crash dù DOM bị re-render giữa các lần bấm; về đúng trạng thái rỗng | PASS — `state.body`/`state.nutrition` về `[]`, đúng hint rỗng cho cả lịch sử lẫn biểu đồ |
| D | Kiểm tra chéo: sau hàng loạt thao tác Cơ thể ở trên, dữ liệu tập luyện (`state.history`/`sessionExercises`/`sessionCardio`) có bị đụng tới không | Hoàn toàn không đổi — 2 domain dữ liệu độc lập | PASS — verify trực tiếp qua state, `_schemaVersion` vẫn =3 |
| E | Sửa 1 dòng lịch sử với giá trị không hợp lệ ở giữa chuỗi 4 prompt (%mỡ=200) | Từ chối toàn bộ thay đổi (kể cả 3 giá trị hợp lệ khác trong cùng lần sửa), giữ nguyên dữ liệu cũ | PASS — so sánh JSON trước/sau giống hệt nhau |
| F | Sửa 1 dòng: để trống cả 3 ô cân nặng/%mỡ/%cơ nhưng vẫn giữ giá trị Calo | Entry `body` của ngày đó bị xoá hẳn, entry `nutrition` (độc lập) vẫn giữ nguyên | PASS — đúng theo thiết kế 2 mảng tách rời |
| G | Gọi `buildExportSheets()`/`exportXlsx()` thật với dữ liệu Cơ thể vừa nhập | Không throw lỗi, sheet "Cơ thể & Dinh dưỡng" có đúng header + dữ liệu, field trống hiển thị `''` thay vì `null`/`undefined` | PASS |

## Hồi quy (regression) các tab cũ
| Tab | Kết quả |
|---|---|
| Hôm nay | Hiển thị đúng, không lỗi |
| Chọn bài | Hiển thị đúng, không lỗi |
| Lịch sử | Hiển thị đúng (kể cả nút Xuất Excel/Sao lưu/Xoá toàn bộ dữ liệu vẫn nguyên vẹn), không lỗi |
| Console trong suốt toàn bộ phiên test (từ lúc mở tới lúc test xong) | **0 lỗi** |

## Giới hạn đã biết
- Chưa test bằng thao tác chạm tay thật trên điện thoại thật (không có thiết bị) — toàn bộ test ở trên là test thật qua Claude Preview (đọc/ghi `state` thật, click/fill thật, không phải chỉ đọc code).
- Form nhập chỉ nhận dữ liệu cho **hôm nay**; muốn nhập bù cho 1 ngày trong quá khứ (vd quên nhập hôm qua) phải làm gián tiếp qua nút ✎ sửa ở danh sách Lịch sử Cơ thể (chuỗi 4 prompt) — chưa có cách nhập trực tiếp nhanh cho ngày cũ. Có thể cải thiện ở bản sau nếu user thấy bất tiện.
- Sanity bound các ô số (0–1000kg, 0–100%, 0–20000kcal) là judgment call, chưa hỏi lại user — nêu rõ ở đây để user xác nhận hoặc yêu cầu đổi nếu cần.
- Sửa 1 dòng lịch sử dùng 4 `prompt()` liên tiếp — hơi dài dòng nhưng nhất quán với pattern có sẵn của app; có thể thay bằng form inline nếu user muốn UX gọn hơn ở bản sau.

## Việc KHÔNG làm
Không đổi SW. Không đổi `DATA_SCHEMA_VERSION`. Không đụng tới bất kỳ hàm nào của 4 tab cũ ngoài các điểm nối tối thiểu đã liệt kê ở trên (`switchScreen`, `NUMERIC_ONLY_IDS`, storage listener, `buildExportSheets`/`exportXlsx`). Không thêm biểu đồ cho calo. Không cho nhập dữ liệu cho ngày quá khứ qua form chính.

## Cần user xác nhận
1. Trên thiết bị thật: vào tab "Cơ thể" (icon ⚖️), nhập thử 1 vài ngày, kiểm tra biểu đồ/mục tiêu/lịch sử hiển thị đúng ý.
2. Xác nhận các sanity bound (0–1000kg, 0–100%, 0–20000kcal) và giới hạn "chỉ nhập được hôm nay qua form chính" có ổn không, hay cần điều chỉnh.
3. Nếu OK → xin phép push GitHub.
