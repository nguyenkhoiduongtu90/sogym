# SoGym_A5_v3 — QA Report

**File:** `SoGym_A5_v3.html` (copied từ `SoGym_A5_v2.html`, chưa được xác nhận "OK" nhưng đã báo cáo cho user → theo quy tắc, vẫn copy trước khi sửa).
**Bug report từ user:** ở tab Chọn bài, gõ từ khóa tìm kiếm, danh sách kết quả hiện ra, nhưng KHÔNG chọn bài nào, chuyển sang tab khác rồi quay lại Chọn bài → ô tìm kiếm KHÔNG bị xóa, vẫn giữ nguyên nội dung cũ, màn hình "trông như bị kẹt" thay vì mở ra ở trạng thái sạch. User hỏi thẳng: *"lỗi này đã có nhắc ở trên, test đã ok sao sang bước này lại xuất hiện lại?"*, yêu cầu phân tích + phương án tối ưu + sửa.

## Phân tích nguyên nhân (trả lời câu hỏi của user)
**Đây KHÔNG phải là hồi quy (regression) của lỗi đã fix trước đó — đây là 1 điểm chưa từng được xử lý, cùng LỚP lỗi nhưng khác VỊ TRÍ, trong đúng màn Chọn bài.**

Lớp lỗi "trạng thái tạm thời bị kẹt khi rời màn, không tự reset" đã được phát hiện và fix 3 lần trước trong A4.5:
- **v7**: form "+ Bài tập khác" (`addCustomCard`)
- **v8**: bài đang được chọn + thẻ chi tiết (`pickerSelectedId` + `detailCard`)
- **v9**: form "+ Thêm Cardio" (`cardioForm`)

Cả 3 lần đó đều sửa đúng phạm vi được audit tại thời điểm đó, và khối reset trong `switchScreen()` (đoạn code chạy khi rời màn Chọn bài) trước bản này **chỉ** gọi `closeCustomExerciseForm()` và `resetPickerSelection()` — **chưa bao giờ đụng tới `#searchInput`, `#chipRow` (chip thiết bị), hay `#subgroupFilter` (bộ lọc nhóm cơ)**. Đây là 3 phần tử UI riêng biệt, chưa từng nằm trong phạm vi audit/fix của v7/v8/v9, nên lỗi "gõ tìm kiếm rồi rời màn không reset" chưa bao giờ được test hay sửa trước đây — nó không "quay lại" sau khi đã fix, mà là lần đầu tiên bị phát hiện.

## Fix
Thêm hàm mới `resetPickerSearchAndFilters()` (đặt ngay sau `resetPickerSelection()`), dùng đúng cơ chế reset-on-navigate-away đã có sẵn:
```js
function resetPickerSearchAndFilters(){
  document.getElementById('searchInput').value = '';
  document.getElementById('subgroupFilter').value = '';
  Array.prototype.forEach.call(document.querySelectorAll('#chipRow .chip'), function(c){
    c.classList.toggle('active', c.dataset.equip === 'all');
  });
}
```
Gọi hàm này trong đúng khối reset đã có của `switchScreen()` (điều kiện `name !== 'picker'` khi đang đứng ở màn Chọn bài), cạnh 2 lệnh reset cũ:
```js
if(name !== 'picker' && document.getElementById('screen-picker').classList.contains('active')){
  var addCustomCard = document.getElementById('addCustomCard');
  if(addCustomCard && addCustomCard.style.display !== 'none') closeCustomExerciseForm();
  if(state.pickerSelectedId) resetPickerSelection();
  resetPickerSearchAndFilters();
}
```
Không tạo cơ chế mới — tái dùng chính xác pattern reset-on-navigate-away đã dùng ở v7/v8/v9, đảm bảo nhất quán và không phải học thêm cách vận hành mới.

## Lỗi phát sinh trong lúc vá (tự phát hiện, đã tự sửa trước khi test)
Khi vá đoạn changelog comment (chuỗi comment HTML rất dài ở đầu `<head>`) để thêm mô tả A5_v3, script Python nối chuỗi bị lỗi logic khiến 1 cặp `-->` bị dư ra (`...v3's own title. --> -->`). Hậu quả: trình duyệt đóng comment ở dấu `-->` đầu tiên, để lại 1 đoạn text `-->` mồ côi ngay trong `<head>` — theo spec HTML5, ký tự non-whitespace nằm ngoài comment trong `<head>` khiến parser **thoát `<head>` sớm và đẩy toàn bộ phần còn lại (kể cả `<style>`) xuống `<body>`**. Đã tự phát hiện qua kiểm tra DOM thực tế (`document.head.children` chỉ còn 12 phần tử, `<style>` nằm trong `<body>` thay vì `<head>`), sửa lại bằng cách xóa `-->` dư, load lại và xác nhận `<style>` đã về đúng `<head>` (13 phần tử), toàn bộ các test bên dưới đều chạy trên bản đã sửa lỗi này.

## Real-browser tests (Claude Preview MCP, server `sogym-static`, cổng 8934)

### Baseline
| Test | Kết quả |
|---|---|
| `localStorage.clear()` + reload, splash ẩn đúng | PASS |
| Cấu trúc DOM `<head>`/`<body>` sau khi sửa lỗi `-->` dư | PASS — `<style>` về đúng `<head>` (13 con), `<body>` bắt đầu bằng `<div>` |
| Console errors baseline | Không có |

### Đúng kịch bản user báo cáo
| Test | Kết quả |
|---|---|
| Gõ "gap"/"Bench"/"Deadlift" vào ô tìm kiếm → có kết quả, KHÔNG chọn bài → chuyển tab khác → quay lại Chọn bài | Ô tìm kiếm rỗng, chip về "Tất cả", bộ lọc nhóm cơ về "Tất cả nhóm cơ", danh sách hiện lại đúng thông báo hướng dẫn ban đầu ("Gõ tên bài hoặc chọn bộ lọc... để tìm trong 873 bài tập") — không còn kết quả cũ, không hiện nhầm toàn bộ 873 bài |

### Các tình huống liên quan (theo yêu cầu "test các tình huống thực tế liên quan")
| Test | Kết quả |
|---|---|
| Tìm kiếm + CHỌN 1 bài (mở thẻ chi tiết) → chuyển tab khác (không bấm Hủy chọn/Thêm) → quay lại | Cả state cũ (v8: `pickerSelectedId`, thẻ chi tiết ẩn) VÀ state mới (search/chip/subgroup) đều reset đồng thời, đúng |
| Chỉ đổi chip thiết bị (vd "Máy cáp"), không gõ tìm kiếm → chuyển tab → quay lại | Chip về "Tất cả" |
| Chỉ đổi bộ lọc nhóm cơ (dropdown), không gõ/không đổi chip → chuyển tab → quay lại | Dropdown về "Tất cả nhóm cơ" |
| Luồng thêm bài bình thường: tìm kiếm → chọn bài → "Thêm vào buổi tập" (tự chuyển sang Hôm nay) → sau đó quay lại Chọn bài | Bài được thêm đúng vào buổi tập (`sessionExercises.length===1`), màn Chọn bài mở lại ở trạng thái hoàn toàn sạch |
| Bấm lại đúng icon "Chọn bài" khi ĐANG ở màn Chọn bài (điều hướng no-op cùng màn) | Ô tìm kiếm và kết quả đang gõ dở KHÔNG bị xóa — đúng theo thiết kế (khối reset chỉ chạy khi `name !== 'picker'`) |
| Re-test lại kịch bản kết hợp đầy đủ (search+chọn+chip+subgroup cùng lúc) sau khi đã sửa lỗi `-->` dư ở trên | PASS — toàn bộ 5 giá trị (search, chip, subgroup, pickerSelectedId, detailCard) đều reset đúng |

### Hồi quy (regression) — các tính năng liên quan trước đó
| Test | Kết quả |
|---|---|
| v7 — form "+ Bài tập khác": mở form, gõ dở tên, chuyển tab, quay lại | Form tự đóng, field đã xóa sạch — vẫn đúng |
| v9 — form "+ Thêm Cardio": mở form, gõ dở số phút, chuyển tab, quay lại | Form tự đóng, field đã xóa sạch — vẫn đúng |
| v6 — chip "★ Yêu thích" (chưa có bài yêu thích nào) | Hiện đúng thông báo "Chưa có bài yêu thích nào..." |
| A5_v1 — sửa/xóa set trong buổi đang tập | Ghi 2 set, đủ nút ✎/🗑, xóa set #1 → set còn lại renumber đúng về #1, `data-si` cập nhật đúng |
| A5_v1 — xóa riêng 1 set trong Lịch sử | Kết thúc bài + kết thúc buổi → Lịch sử lưu đúng, mở rộng buổi thấy đủ nút `.edit-set-btn`/`.del-set-btn` với `data-hi/ei/si` đúng |
| A5_v2 — phân bố `force` trong catalog runtime | Đẩy 510 / Kéo 285 / Khác 78 = 873 — khớp data-level, không bị ảnh hưởng bởi bản vá này |
| Console errors trong TOÀN BỘ quá trình test (kể cả lúc phát hiện + tự sửa lỗi `-->` dư) | Không có |

## Ghi chú minh bạch — lỗi title tag ở `SoGym_A5_v2.html`
Trong lúc chuẩn bị cập nhật title cho `SoGym_A5_v3.html`, tự phát hiện: script cập nhật title/changelog cho `SoGym_A5_v2.html` trước đó chạy 2 lần (lần 1 lỗi do sai anchor text, lần 2 sửa lại đúng) — nhưng bản sửa lại lần 2 chỉ khôi phục đúng phần changelog comment, **quên không kèm lại phần thay `<title>`**. Hậu quả: `SoGym_A5_v2.html` đã giao cho user với `<title>` (tên tab trình duyệt) vẫn ghi nhầm "A5_v1", dù toàn bộ nội dung dữ liệu thực tế (389 `force` + 87 tên) đã được vá và verify đúng 100% — đây thuần túy là lỗi hiển thị tên tab, không phải lỗi chức năng. Đã tự sửa đúng ở `SoGym_A5_v3.html` (title ghi đúng "A5_v3" ngay từ lần chạy script đầu). `SoGym_A5_v2.html` không được sửa lại vì file này sắp được archive (đã bị v3 thay thế). Báo cáo minh bạch điểm này cho user biết, theo đúng tiền lệ 2 "Process reminder" đã có trong roadmap.

## Status
Đã phân tích đúng nguyên nhân (không phải hồi quy — là gap chưa từng audit), đã fix, đã tự phát hiện và tự sửa 1 lỗi phát sinh trong lúc vá (HTML comment parser issue), test thật đầy đủ tất cả các tình huống liên quan user yêu cầu + hồi quy toàn diện, PASS toàn bộ, 0 console error. Chờ user xác nhận **"A5_v3 OK"**.
