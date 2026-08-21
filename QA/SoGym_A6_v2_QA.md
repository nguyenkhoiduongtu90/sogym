# SoGym_A6_v2 — QA Report

**File:** `SoGym_A6_v2.html` (copied từ `SoGym_A6_v1.html`, sau khi v1 đã được code+test xong và báo cáo cho user, đúng quy tắc "copy sang file mới trước khi sửa tiếp").
**Bước roadmap:** A6 — Data Management (🎯 flagged). Đây là vòng mô phỏng thất bại **BỔ SUNG**, theo yêu cầu user: *"kiểm tra, tự giả lập thêm 3-5 tình huống sai sót có thể xảy ra, đưa ra giải pháp tối ưu, chỉnh sửa trước khi tôi đưa ra kết luận ở bước này"* — tức là tìm thêm lỗi NGOÀI những gì `SoGym_A6_v1_QA.md` đã test, và phải TỰ SỬA trước khi xin kết luận.

## Bối cảnh
A6_v1 đã test đầy đủ "happy path" của Backup/Restore (vốn có sẵn từ trước, lần đầu được QA chính thức ở A6_v1) và toàn bộ Reset-all-data + Integrity-check (mới). Vòng này đào sâu thêm vào các đường thất bại/biên (edge case) của chính luồng Restore và của tương tác đa-tab với Reset-all-data — 2 khu vực chưa được thử nghiệm kỹ ở A6_v1.

## 5 tình huống tự giả lập (real-browser test, Claude Preview MCP, server `sogym-static` cổng 8934)

| # | Tình huống | Kết quả trên A6_v1 (TRƯỚC fix) |
|---|---|---|
| 1 | Restore trong khi đang có buổi tập dở (session đang mở màn Nhập set) | **LỖI** — xem Bug A |
| 2 | Restore trong khi đồng hồ nghỉ (rest timer) đang chạy | **LỖI** — xem Bug A |
| 3 | Hủy hộp thoại `confirm()` của Restore, rồi thử chọn lại đúng file đó | **LỖI** — xem Bug B |
| 4 | Restore file có dữ liệu lồng bị hỏng (1 session `null` trong `history`) | **LỖI** — xem Bug C |
| 5 | Mở 2 tab, tab A bấm "Xóa toàn bộ dữ liệu", tab B nhận `storage` event | **LỖI** — xem Bug D |

Cả 5 tình huống đều cho ra **4 lỗi thật, xác nhận bằng test trực tiếp trên browser** (không chỉ đọc code suy luận), root-cause chính xác tới từng dòng.

## 4 lỗi tìm được + giải pháp (đã code + re-test xong)

### Bug A — Restore không reset state runtime tạm thời (session/timer/picker)
**Hiện tượng:** Restore thay toàn bộ `state.sessionExercises`/`history`/... nhưng không đụng tới `state.currentLogIndex`, `state.pickerSelectedId`, hay rest-timer đang chạy (`state.restTimerHandle`). Nếu người dùng đang đứng ở màn Nhập set lúc Restore, `currentLogIndex` cũ (vd =2) trỏ vào mảng session mới (rỗng hoặc khác) → bấm "Ghi nhận set" gây `TypeError` (bắt được qua `window.onerror`, không lộ ra `try/catch` bao quanh `.click()`), set bị mất âm thầm không báo lỗi. Đồng hồ nghỉ vẫn chạy ngầm tham chiếu dữ liệu cũ.

**Fix:** ngay sau khi lưu dữ liệu mới, gọi `stopRestTimer()` (hàm có sẵn), reset `state.currentLogIndex = -1` (đúng giá trị mặc định gốc của app), `state.pickerSelectedId = null`, rồi `switchScreen('home')` đưa người dùng về màn an toàn — cùng nguyên lý "đưa app về trạng thái sạch sau khi thay toàn bộ dữ liệu" mà `resetAllData()` đã áp dụng.

**Re-test (PASS):** Seed session dở + rest timer đang chạy (`restRunningBefore:true`, `restTimerHandleBefore:3`) → Restore file hợp lệ → sau restore: `currentLogIndexAfter:-1`, `pickerSelectedIdAfter:null`, `restRunningAfter:false`, `restTimerHandleAfter:null`, `activeScreenAfter:"screen-home"`. Không còn crash, không còn timer ngầm.

### Bug B — 3 nhánh thoát sớm của Restore không xóa giá trị input file
**Hiện tượng:** Dòng `restoreFile.value=''` nằm NGOÀI `try/catch`, nên chỉ chạy khi thành công hoặc khi rơi vào `catch`. Cả 3 nhánh `return` sớm bên trong try (thiếu marker `_sogym_backup`, `migrateData()` trả null, hoặc hủy `confirm()`) đều bỏ qua dòng này — input giữ nguyên đường dẫn file cũ. Vì trình duyệt KHÔNG bắn sự kiện `change` khi chọn lại đúng file đã chọn trước đó, người dùng hủy rồi thử lại cùng file sẽ thấy nút Restore "im lặng không phản hồi".

**Fix:** chuyển dòng xóa `value` vào khối `finally{}` để chạy ở MỌI nhánh thoát.

**Re-test (PASS):** Hủy `confirm()` → `inputValueAfterCancel:""` (trước đây sẽ là đường dẫn file cũ). Test lại 2 nhánh reject còn lại (sai marker, JSON lỗi cú pháp) → cả 2 đều có `inputVal:""` sau khi xử lý.

### Bug C — Dữ liệu lồng lỗi trong file backup (vd session `null`) khiến Restore hiện nhầm "file hỏng" dù đã lưu thành công
**Hiện tượng:** `saveState()` chạy `normalizeDataModelV3()`, nhưng `normalizeWorkoutModel(null)` chỉ no-op (không loại phần tử `null` khỏi mảng `history`). `renderHistory()` (gọi ngay sau đó, vẫn trong `try` của Restore) đọc thuộc tính trên session `null` → ném exception → rơi vào `catch(e)` của chính Restore → hiện `alert('File sao lưu bị lỗi...')` — **sai lệch nghiêm trọng**: dữ liệu thật ra ĐÃ lưu đúng vào `localStorage` trước khi crash, nhưng người dùng bị báo nhầm là restore thất bại.

**Fix:** gọi `runIntegrityCheck()` (hàm có sẵn, đã test kỹ ở A6_v1, đúng nhiệm vụ dọn dữ liệu lỗi cấu trúc) ngay sau `saveState()`, trước khi render.

**Re-test (PASS):** Restore file có `history:[null, {...}, {...}]` → không crash (`errors:[]`), hiện đúng `alert('Khôi phục thành công.')` (không còn hiện nhầm "file hỏng"), `historyHasNull:false`, `historyLenAfter:2` (2 session hợp lệ được giữ, session `null` bị dọn).

### Bug D — Tab B không đồng bộ đúng khi tab A xóa toàn bộ dữ liệu (`resetAllData()`)
**Hiện tượng:** `storage` event listener gọi `loadState()` vô điều kiện. Khi tab A xóa hẳn key (`ev.newValue === null`), `SoGymDataStore.read()` trả `null` → `loadState()` no-op, KHÔNG cập nhật `state` ở tab B — nhưng listener vẫn hiện banner "đã đồng bộ dữ liệu", khiến người dùng lầm tưởng đã cập nhật. Nguy hiểm hơn: nếu người dùng thao tác tiếp ở tab B (vd thêm 1 set) và trigger `saveState()`, dữ liệu CŨ (đã bị xóa) sẽ bị ghi ngược lại `localStorage` — vô hiệu hóa hoàn toàn thao tác "xóa toàn bộ dữ liệu" vừa làm ở tab A.

**Fix:** trong listener `storage`, kiểm tra `ev.newValue === null` là trường hợp riêng → gọi `location.reload()` cho tab B luôn, giống hệt cách `resetAllData()` tự làm sạch tab gốc của nó — không cần phát minh cơ chế mới.

**Re-test (PASS):** Dispatch `StorageEvent` giả lập với `newValue:null` → set 1 biến đánh dấu trên `window` trước khi dispatch → sau khi xử lý, biến đó biến mất (bằng chứng gián tiếp nhưng chắc chắn: trang đã load lại — biến JS trong bộ nhớ cũ bị xóa sạch) → verify tiếp trang mới load sạch: `splashHidden:true`, `typeof state:"object"`, 0 lỗi console.

## Hồi quy toàn bộ (đảm bảo 4 fix trên không phá vỡ gì đã hoạt động)

| Khu vực | Test | Kết quả |
|---|---|---|
| Backup/Export | Seed history+customExercises+customOverrides+body → export | Payload đầy đủ, đúng field, đúng `_sogym_backup`/`_schemaVersion` |
| Restore — happy path | File hợp lệ đầy đủ (đúng schema hiện tại, set có `rm` như dữ liệu thật) | `historyBuoi` đúng, `customExercisesLen` đúng, `bodyLen` đúng, alert đúng "Khôi phục thành công.", `currentLogIndex:-1`, input cleared |
| Restore — sai marker | JSON hợp lệ, thiếu `_sogym_backup` | Từ chối đúng, dữ liệu cũ giữ nguyên, input cleared (cải thiện so với v1: trước đây input KHÔNG bị clear ở nhánh này) |
| Restore — JSON lỗi cú pháp | File `{bad json` | Từ chối đúng, đúng message lỗi JSON thật, input cleared |
| Restore — schema cũ (v1, thiếu `_schemaVersion`/`body`/`nutrition`/`goals`) | `migrateData()` nâng cấp | Restore thành công, mọi field thiếu tự khởi tạo đúng kiểu mảng |
| Reset-all-data 🎯 (đủ lại 5 kịch bản như A6_v1) | Hủy confirm / hủy prompt / gõ sai / gõ rỗng / gõ đúng "XÓA" có khoảng trắng thừa | Tất cả đúng như A6_v1: 4 nhánh đầu dữ liệu nguyên vẹn, nhánh cuối xóa đúng |
| Reset-all-data — luồng thật đầy đủ (không mock `location.reload`) | Seed dữ liệu thật → xóa → để reload chạy thật | `localStorage` = null, `history.length=0`, splash ẩn đúng, app khởi động sạch |
| Integrity check — 5 loại lỗi injected cùng lúc | orphan override, customExercises trùng id/thiếu id, session `null`, `sets` không phải mảng | Dọn đúng cả 5, notice đúng "Đã tự động dọn 5 mục dữ liệu lỗi..." |
| Integrity check — idempotency | Mở lại tab Lịch sử lần 2 | 0 lỗi thêm, notice ẩn |
| A5 — picker search/chip/filter reset khi rời tab | Gõ "bench" → 49 kết quả → rời tab → quay lại | Search input tự reset về rỗng |
| A5 — set trong buổi đang tập: thêm/sửa/xóa | Thêm 2 set → sửa set #1 (reps 10→12, weight 50→60, `rm` tính lại đúng 84) → xóa set #2 | Tất cả đúng, mảng còn lại đúng 1 phần tử |
| A5 — kết thúc buổi tập → lưu History | `btnEndSession` | `history.length` tăng đúng 1, đúng số bài tập, `sessionStarted` về `false` |
| Console errors | Trong suốt TOÀN BỘ quá trình test (5 kịch bản mới + toàn bộ hồi quy trên) | **0 lỗi** |
| Baseline cuối | `localStorage.clear()` + reload | Splash ẩn đúng, màn Hôm nay active, `typeof state === 'object'` |

## Ghi chú phụ (không phải bug sản phẩm)
Trong lúc dựng dữ liệu test cho Bug C, lần đầu dùng set giả dạng `{reps:8, kg:0}` (sai tên field, thiếu `rm`) làm `renderHistory()` báo lỗi `toFixed` trên `undefined`. Xác nhận đây là lỗi Ở DỮ LIỆU TEST tự tạo (field đúng phải là `weight`, và `rm` luôn được tính sẵn ở thời điểm ghi set thật trong app — không bao giờ thiếu trong 1 file backup xuất ra từ chính app), không phải lỗi sản phẩm. Sửa lại dữ liệu test đúng schema (`weight`+`rm`) thì restore chạy đúng, không lỗi. Không cần fix code cho trường hợp này vì `runIntegrityCheck()` được thiết kế có chủ đích là KHÔNG đụng vào giá trị reps/kg/rm thật (đã ghi rõ trong tài liệu A6_v1).

## Status
Đã tìm ra và **tự sửa xong cả 4 lỗi** trước khi xin kết luận, đúng yêu cầu. Toàn bộ 4 fix đều tái sử dụng cơ chế có sẵn trong codebase (`stopRestTimer()`, `runIntegrityCheck()`, quy ước sentinel `currentLogIndex=-1`, pattern reload-để-làm-sạch của `resetAllData()`) — không phát minh cơ chế mới, giữ code nhất quán. Re-test đầy đủ cả 4 fix (real-browser, không mock những gì có thể test thật) + hồi quy toàn diện Backup/Restore/Reset/Integrity-check/A5. PASS toàn bộ, 0 console error. Chờ user xác nhận **"A6_v2 OK"**.
