# BÁO CÁO QA — Sổ Gym A4.4_v1 (Exercise Picker / Search / Filter)

**File sửa:** `SoGym_A4_4_v1.html` (dựa trên `SoGym_A4_3_v2.html` đã được anh xác nhận **"A4.3_v2 OK"**, không ghi đè, không sửa file A4.3_v2 gốc)
**Phương pháp test:** Chạy THẬT trong trình duyệt (Chromium qua Claude Preview, static server `python -m http.server`), không phải jsdom. Đối chiếu số liệu lọc với audit Python/openpyxl trên catalog thật.

---

## 0. LƯU Ý QUY TRÌNH (tự phát hiện, đã sửa)

Trong lúc code, tôi đã **lỡ sửa trực tiếp vào `SoGym_A4_3_v2.html`** (file đã chốt OK) thay vì tạo file mới ngay từ đầu — vi phạm nguyên tắc "không overwrite file đã xác nhận". Tôi đã phát hiện và tự sửa: **khôi phục `SoGym_A4_3_v2.html` về đúng nguyên trạng đã xác nhận** (đã kiểm tra lại bằng diff — 0 khác biệt so với lúc anh OK), rồi chuyển toàn bộ code A4.4 sang file mới `SoGym_A4_4_v1.html`. Đã xác nhận: vị trí marker catalog 873 bài trong `SoGym_A4_3_v2.html` quay đúng về dòng 1658 như trước khi tôi động vào.

---

## 1. MỤC TIÊU A4.4_v1

Theo phạm vi anh đã chọn:
1. Lọc theo nhóm cơ (subgroup).
2. Kết hợp nhiều bộ lọc cùng lúc (từ khóa + thiết bị + nhóm cơ).
3. Tìm kiếm tiếng Việt không phân biệt dấu.
4. Sắp xếp kết quả A-Z theo tên tiếng Việt.

---

## 2. PHÁT HIỆN DỮ LIỆU QUAN TRỌNG (đã hỏi trước khi code)

Field `sub` thật của 873 bài có **26 giá trị khác nhau**, nhưng danh sách chuẩn `SUBGROUP_OPTIONS` (dùng khi SỬA override) chỉ có 21 giá trị — 10 giá trị còn lại (Đùi trước, Tay trước, Lưng giữa, Bắp chân, Lưng dưới, Cẳng tay, Cơ thang, Đùi trong, Cổ, Đùi ngoài) chiếm 359/873 bài (41%). Theo lựa chọn anh đã chọn: dropdown lọc nhóm cơ lấy từ **giá trị thật trong dữ liệu** (26 giá trị, tính động qua `resolvedSub()` — tôn trọng override), **không đổi** danh sách 21 mục chuẩn dùng để sửa override.

---

## 3. LỖI PHÁT HIỆN VÀ SỬA TRONG QUÁ TRÌNH TỰ TEST (nghiêm trọng — HIGH)

**Lỗi:** File có 2 khối `<script>` tách biệt — script 1 chứa toàn bộ logic app (kể cả đoạn `KHỞI TẠO`), script 2 (nạp SAU) chứa dữ liệu catalog 873 bài (`window.SOGYM_EXERCISE_CATALOG`). Tôi ban đầu đặt lệnh gọi `populateSubgroupFilter()` vào đoạn `KHỞI TẠO` — hàm này gọi `allExercises()` → truy cập catalog **trước khi catalog kịp nạp** → ném `TypeError` → toàn bộ code chạy sau nó trong cùng script (`renderHome()`, ẩn splash, đăng ký Service Worker) bị dừng.

**Hậu quả nếu không phát hiện:** app bị **kẹt vĩnh viễn ở màn hình splash**, không vào được Home — lỗi nghiêm trọng, chỉ bắt được nhờ test thật trên browser (đọc code sẽ không thấy vì catalog "trông có vẻ" đã có sẵn).

**Cách phát hiện:** test thật — `splashStillVisible: true` dù đã đợi lâu, `subgroupFilterOptionCount` vẫn = 1 (không populate được) dù code có vẻ đúng.

**Cách sửa:** bỏ lệnh gọi `populateSubgroupFilter()` khỏi `KHỞI TẠO`; chuyển sang gọi khi mở màn Chọn bài (trong `showScreen`, giống cách `renderPicker()` đã được gọi) — thời điểm này chắc chắn cả 2 script đã nạp xong vì là do người dùng chủ động điều hướng sau khi trang đã tải xong.

**Test lại sau khi sửa:** splash ẩn đúng, Home hiện đúng, 0 console error, dropdown populate đúng 27 option (1 mặc định + 26 thật) khi mở màn Chọn bài.

---

## 4. KẾT QUẢ TEST (chạy thật, có số liệu)

| Test | Kết quả |
|---|---|
| Console error/warning toàn phiên | 0 |
| App khởi động, splash ẩn, Home hiện | PASS (sau khi sửa lỗi mục 3) |
| Dropdown nhóm cơ — số option | 27 (1 "Tất cả" + 26 giá trị thật, A-Z) |
| Lọc riêng "Đùi trước" | **148 bài** — khớp chính xác audit Python trên catalog thật |
| Kết hợp chip "Máy cáp" + dropdown "Ngực trên" | UI = 2, đối chiếu thủ công qua `allExercises().filter(...)` = 2 — khớp |
| Sắp xếp A-Z | Đúng thứ tự theo `localeCompare(..., 'vi')` |
| Tìm "gap" vs "gập" (không dấu / có dấu) | Cùng ra 176 kết quả — xác nhận không phân biệt dấu hoạt động đúng |
| Override subgroup mới lạ (VD "Nhóm Override Test XYZ") → dropdown tự cập nhật | PASS, cập nhật động sau ~150ms (đúng cơ chế debounce sẵn có) |
| Bài tự thêm (customExercises) với `sub` lạ → xuất hiện trong dropdown | PASS |
| Catalog gốc có bị mutate sau override? | Không (`Barbell_Squat.sub` gốc vẫn "Đùi trước") |
| Luồng đầy đủ: lọc → chọn bài → thêm vào buổi tập → ghi set → kết thúc buổi → History | PASS, cấu trúc History đúng schema (workoutId/exerciseId/setId/catalogId) |
| Reload trang thật sau khi có History | History còn nguyên, catalog còn 873, splash vẫn ẩn đúng, 0 console error |
| Dữ liệu catalog 873 bài trong file mới có bị đụng? | Không — diff nhị phân xác nhận **byte-identical** với `SoGym_A4_3_v2.html` |

---

## 5. LỖI CÒN TỒN TẠI / GHI NHẬN (không tự ý xử lý)

- FINDING-003 (SheetJS CDN chưa pre-cache) — vẫn chưa xử lý, ngoài phạm vi A4.4.
- NOT TESTABLE: iPhone/Safari thật, thao tác chạm thật, hiệu năng máy yếu/mạng chậm.
- Đây là A4.4_v1 lần đầu — nếu anh muốn thêm cải tiến khác (sort theo tiêu chí khác, nút "Xóa bộ lọc", v.v.) sẽ làm ở A4.4_v2 theo đúng quy tắc từng bước.

---

## 6. FILE KẾT QUẢ

- `SoGym_A4_4_v1.html` — file chính, đã sửa và test.
- `SoGym_A4_4_v1_QA.md` — báo cáo này.
- `SoGym_A4_3_v2.html` — **không đổi**, đã xác nhận khôi phục đúng nguyên trạng.
- `SW.js` — không đổi.

**Trạng thái:** Đã hoàn thành 4 mục tiêu A4.4_v1 (lọc nhóm cơ, kết hợp bộ lọc, tìm không dấu, sắp xếp A-Z). Phát hiện và tự sửa 1 lỗi nghiêm trọng (treo splash) trong quá trình test thật trước khi giao. Chờ anh xác nhận **"A4.4_v1 OK"** trước khi sang bước kế tiếp.

---

## 7. GIẢ LẬP 5 TÌNH HUỐNG LỖI THỰC TẾ (bước mới, làm theo yêu cầu của anh trước khi xin OK)

Theo quy tắc mới anh xác nhận áp dụng bắt buộc từ nay: sau khi code xong 1 version, phải chủ động giả lập 3-5 tình huống lỗi thực tế nhiều khả năng xảy ra nhất, test thật trên browser, rồi mới báo xong. Đã chạy 5 tình huống sau trên `SoGym_A4_4_v1.html` (test thật qua Claude Preview/Chromium, không phải đọc code):

| # | Tình huống | Cách test | Kết quả |
|---|---|---|---|
| 1 | Chuyển màn Home↔Picker↔Home liên tục 8 lần (rò rỉ listener, dropdown nhân đôi option) | Gọi `showScreen('picker')`/`showScreen('home')` lặp lại, kiểm tra số option + số option trùng | **PASS** — luôn đúng 27 option, không trùng, không tăng dần |
| 2 | Đang lọc theo 1 nhóm cơ, rồi override đổi nhóm cơ của đúng bài đang chọn (`pickerSelectedId`) sang giá trị khác → bài biến mất khỏi danh sách lọc trong khi vẫn đang "được chọn" | Lọc "Đùi trước" (148 bài) → chọn bài đầu tiên → override subgroup bài đó sang "Nhóm Override Test XYZ" → kiểm tra danh sách, detail box, nút "Thêm vào buổi tập" | **PASS** — danh sách giảm đúng 148→147, bài biến mất khỏi list lọc (đúng), nhưng detail box vẫn hiển thị đúng bài đang chọn để sửa tên/nhóm cơ (hành vi giống hệt kiến trúc A4.3 gốc, không phải lỗi mới do A4.4 gây ra) — `catalogById`/`pickerSelectedId` vẫn trỏ đúng bài hợp lệ, không có tham chiếu hỏng |
| 3 | Reload trang thật khi đang có đủ 3 bộ lọc cùng lúc (từ khóa + chip + nhóm cơ) | Set search="gập" + chip + subgroup="Đùi trước" → `location.reload()` thật → kiểm tra sau khi tải lại | **PASS** — không treo, không lỗi console; bộ lọc reset sạch về mặc định (đúng thiết kế, không phải lỗi — bộ lọc là state UI tạm, không lưu localStorage); vào lại Picker thì dropdown populate lại đúng, không hỏng |
| 4 | Sửa nhanh liên tiếp 3 lần ô nhập nhóm cơ override trong lúc debounce 150ms đang chạy (gõ→blur→gõ→blur→gõ→blur, mỗi lần cách nhau 30ms) | Giả lập 3 chu kỳ nhập/blur nhanh trên `subgroupInput` | **PASS** — giá trị cuối cùng luôn thắng đúng ("Race Test Sub 2"), không bị lưu nhầm giá trị cũ, dropdown không có entry rác/trùng, không có race condition |
| 5 | Kết hợp bộ lọc ra 0 kết quả, sau đó xóa hết bộ lọc về trạng thái ban đầu | Set từ khóa vô nghĩa + subgroup thật (0 kết quả) → xóa hết về rỗng | **PASS** — đúng phân biệt 2 thông báo khác nhau: "Không tìm thấy bài phù hợp" (có lọc nhưng 0 kết quả) vs. "Gõ tên bài hoặc chọn bộ lọc..." (chưa lọc gì) — không lẫn lộn |

**Kết luận:** Cả 5 tình huống đều PASS, không phát hiện bug mới. Do đó **không cần tạo A4.4_v2** — file giao vẫn là `SoGym_A4_4_v1.html` như cũ, không đổi.

**Dọn dẹp:** 2 override thử nghiệm tạo ra trong lúc giả lập (tình huống 2 và 4, trên bài `All_Fours_Quad_Stretch` và `Bodyweight_Squat`) đã được xóa khỏi `localStorage` thật ngay sau khi test xong, xác nhận qua reload lại: `customOverrides` rỗng, cả 2 bài quay về nhóm cơ gốc "Đùi trước", không còn dữ liệu rác nào sót lại từ quá trình test.

**Trạng thái cuối cùng:** Đã hoàn thành cả 4 mục tiêu A4.4_v1 lẫn bước giả lập 5 tình huống lỗi bắt buộc mới. Chờ anh xác nhận **"A4.4_v1 OK"**.
