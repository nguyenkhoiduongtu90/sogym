# Sổ Gym — Final Audit: HANDOFF NOTE (chuyển máy)

**Mục đích file này:** cho phép 1 phiên Claude Code MỚI (trên máy khác, không có lịch sử hội thoại cũ) tiếp tục ĐÚNG mạch công việc "Final Audit + Optimization + Hardening" của Sổ Gym mà không cần hỏi lại user. Đọc file này TRƯỚC khi làm bất cứ gì.

**Ngày ghi:** 2026-08-22. **Trạng thái tại thời điểm ghi:** Bước 1 đã xong (kể cả rà soát sâu vòng 2). Bước 2 đang ở Batch 1 — đã đưa đề xuất chi tiết cho user, **CHƯA được user xác nhận**. Bước 3 CHƯA bắt đầu.

---

## 1. Bối cảnh dự án (bắt buộc biết trước khi làm gì)

- File audit target: `SoGym_A9_v4.html` (baseline hiện tại trên đĩa, không được sửa ngoài quy trình audit này) — single-file HTML, ES5-only (KHÔNG dùng let/const/arrow/template literal), localStorage-only, offline-first, nhắm iPhone/Safari, không có git, không build step.
- Service Worker: `SW_A7_v2.js` (cùng thư mục).
- Không có `manifest.json` (có chủ đích — chỉ dùng Add to Home Screen của Safari).
- Versioning: đặt tên file thủ công theo version, bản cũ lưu vào `_old_versions/` (không cần mang theo khi chuyển máy).
- Không có test tự động; kiểm chứng qua Claude Preview MCP (Chromium) — **không có iPhone thật**, nên mọi finding đặc thù Safari/iOS phải gắn nhãn "chưa test trên iPhone thật".

## 2. 4 tham số đã CHỐT cho vòng Final Audit này (không hỏi lại user)

1. Baseline = `SoGym_A9_v4.html` đúng như đang có trên đĩa lúc bắt đầu audit.
2. Chỉ ra **1 báo cáo duy nhất** cho toàn bộ 24 nhóm (không tách nhiều file báo cáo nhỏ).
3. Vòng này **KHÔNG phải 1 bước đánh số trong roadmap chính** — ghi tiến độ vào `sogym_roadmap.md` (file memory), **TUYỆT ĐỐI KHÔNG đụng** `QA/SoGym_Roadmap_TongQuan.md`.
4. Test giới hạn ở Claude Preview MCP (Chromium) — không có iPhone thật; mọi finding Safari/iOS gắn nhãn "chưa test trên iPhone thật".

## 3. Quy trình 7 bước đã thống nhất (theo `sogym_final_audit_prompt.md`)

Bước 1 = audit toàn diện, KHÔNG sửa code, phân loại 🔴🟠🟡🟢🔵, DỪNG chờ xác nhận → Bước 2 = chỉ đề xuất phương án (KHÔNG sửa code) → Bước 3 = sửa (sau khi user xác nhận) → Bước 4 = regression (riêng batch vừa sửa) → Bước 5 = performance (tập trung sau Batch 2 + tổng ở cuối) → Bước 6 = so sánh before/after tổng → deliverable cuối: `SoGym_A_Final_Optimized_v1.html` (+ `SoGym_A_Final_Optimized_SW_v1.js` nếu có sửa SW) + `SoGym_Final_Optimization_Report.md`.

**Quy tắc thực thi đã chốt với user (quan trọng):**
- Làm theo **Batch** (không làm hết 24 nhóm cùng lúc): Batch → Bước 2 (đề xuất riêng batch) → user xác nhận → Bước 3 (sửa) → Bước 4 (regression riêng batch) → sang batch kế tiếp.
- **CHỈ dùng 1 file WIP DUY NHẤT** trong suốt quá trình sửa: `SoGym_A_Final_WIP.html` — KHÔNG tạo file trung gian versioned mỗi batch (tránh phình `_old_versions/`).
- File deliverable cuối cùng (`SoGym_A_Final_Optimized_v1.html`, report...) chỉ tạo **1 lần duy nhất** sau khi TẤT CẢ batch đã xong.

## 4. Trạng thái công việc đã hoàn thành

- **Bước 1 (vòng A — audit tĩnh + runtime qua Preview MCP, 24 nhóm):** XONG. Toàn bộ nằm trong `QA/SoGym_FinalAudit_Buoc1_Report.md`, PHẦN A + PHẦN B (runtime).
- **Bước 1 rà soát sâu vòng 2 (theo yêu cầu user "rà lại thật kỹ, chắc chắn không sót lỗi tiềm ẩn"):** XONG. 4 agent song song soi 4 cụm (data lifecycle / rendering-calc / date-number-timer / async-network) + tự kiểm chứng từng finding quan trọng bằng cách đọc code tận nơi (loại bỏ false-positive). Kết quả nằm trong **PHẦN C** của cùng file report — 7 lỗi tiềm ẩn MỚI (C1–C7) + 2 mục ghi nhận thêm (C8–C9), và đã loại 6 báo động giả (ghi lại để minh bạch).
- **Bước 2 — đã đưa BẢN ĐỒ 5 BATCH** (cập nhật sau khi có C1–C9) và **ĐỀ XUẤT CHI TIẾT ĐẦY ĐỦ CHO BATCH 1** — xem mục 5 và 6 dưới đây. **User CHƯA xác nhận Batch 1** (đang hỏi về chuyển máy, chưa nói "OK Batch 1").

➡️ **Việc cần làm tiếp khi resume:** trình lại tóm tắt Batch 1 cho user (hoặc hỏi lại nếu cần), chờ xác nhận rõ ràng ("OK Batch 1" hoặc tương đương), rồi mới sang Bước 3 (sửa trên `SoGym_A_Final_WIP.html`). KHÔNG tự ý sửa code khi chưa có xác nhận.

## 5. Bản đồ 5 Batch (đã chốt cấu trúc, thứ tự có thể điều chỉnh nếu user yêu cầu)

| Batch | Chủ đề | Lỗi bao gồm |
|---|---|---|
| **1** | Chống sập + toàn vẹn dữ liệu (pipeline load/save/boot/restore) | 🔴 boot crash (Nhóm 20) + C1 (đường crash boot phụ), 🟠 loadState fail âm thầm (N20), 🟠 integrity gap ở boot (N21), 🟡 FileReader thiếu onerror (N20), 🟡 restore commit-before-validate (C5), 🟡 thumbHTML thiếu guard (C6) |
| **2** | Đúng-đắn hiển thị & runtime | 🟠 không escape HTML (C2), 🟠 rest timer không dừng khi đổi tab (C3), 🟡 goal grid sai chỉ số hiện tại (C4) |
| **3** | Hiệu năng & khởi động (≙ Bước 5 làm sau Batch 2) | 🔴 mascot base64 66.5% file (N17/N18), 🔴 SheetJS blocking trong `<head>` (N17), 🟠 renderHistory không giới hạn quy mô (N14), 🟠 SW cache HTML cũ tăng vô hạn + không cache SheetJS (N11) — **có chạm SW_A7_v2.js → sẽ sinh file SW version mới** |
| **4** | Mobile Safari (chưa test iPhone thật) | 🟠 thiếu `viewport-fit=cover` (N22), 🟡 font-size<16px gây zoom Safari (N22), 🟡 modal + bàn phím ảo/visualViewport (N22), 🟢 `Promise.finally` rủi ro Safari cũ (C8) |
| **5** | Dọn dẹp nhẹ & nhất quán | 🟡 PR xuất Excel khoá theo tên thay vì id (C7), 🟡 date-format lặp code → dùng chung `vnDate()` (N3), 🔵 `<title>` ghi nhầm version A8 thay vì A9 (N22), 🟢 `sessionDateISO` thiếu `||null` nhất quán (C9), các mục minor khác trong C9 |

Batch 2–5 CHƯA có đề xuất chi tiết (sẽ soạn khi tới đúng batch, theo đúng quy trình per-batch).

## 6. ĐỀ XUẤT CHI TIẾT BATCH 1 (Bước 2 — đã trình user, CHỜ XÁC NHẬN)

Toàn bộ Batch 1 chỉ đụng `SoGym_A9_v4.html` (không đụng SW). Thực hiện trên `SoGym_A_Final_WIP.html`.

### Fix 1.1 — Sửa GỐC: lọc phần tử hỏng tại `normalizeDataModelV3` (trị 🔴 N20 + 🟠 C1, nền cho C5)
Vấn đề: `data.history.forEach(normalizeWorkoutModel)` (dòng ~923) vứt bỏ giá trị trả về; `normalizeWorkoutModel(null)` trả `null` nguyên vẹn → phần tử null sống sót trong `history` → sập ở `renderHome`/`renderHistory`/`computeHistoryUsageCounts`/`allTimeMaxByExercise`.

Phương án — lọc null ở CẢ 3 TẦNG mảng ngay tại chốt chuẩn hoá chung:
```js
// normalizeDataModelV3: history
data.history = data.history.filter(function(w){ return w && typeof w === 'object'; });
data.history.forEach(normalizeWorkoutModel);
// normalizeWorkoutModel: exercises + cardio
workout.exercises = workout.exercises.filter(function(o){ return o && typeof o === 'object'; });
workout.exercises.forEach(normalizeExerciseModel);
// normalizeExerciseModel: sets
ex.sets = ex.sets.filter(function(o){ return o && typeof o === 'object'; });
ex.sets.forEach(normalizeSetModel);
```
Vì sao tốt nhất: chốt `normalizeDataModelV3` chạy trên MỌI đường vào/ra — read (`loadState` ~972), write (`saveState` ~947), và restore (`saveState` trong FileReader onload). Sửa 1 nơi bịt hết đường crash (kể cả C1 và một phần C5). Thay thế "bọc try/catch từng render" chỉ giấu triệu chứng, dữ liệu hỏng vẫn nằm trong localStorage; "chỉ thêm runIntegrityCheck ở boot" là thêm chốt thứ 4 mà không sửa đường ghi.

### Fix 1.2 — Bọc boot bằng try/catch/**finally**, dời ẩn splash vào `finally` (lớp phòng vệ 2, 🔴 N20)
Vấn đề: chuỗi khởi tạo (dòng ~3211–3216: `loadState(); checkAndArchiveStaleSession(); renderHome(); renderHistory(); updateRingUI(); updateLiveClock();`) không có try/catch; `setTimeout` ẩn splash (dòng ~3229) chạy SAU chuỗi này → throw bất kỳ = treo splash vĩnh viễn.

Phương án:
```js
try {
  loadState();
  runIntegrityCheck();          // Fix 1.3
  checkAndArchiveStaleSession();
  renderHome(); renderHistory(); updateRingUI(); updateLiveClock();
} catch(e){
  console.error('Boot lỗi:', e);
  showBootErrorBanner();        // banner mới, khuyên Khôi phục từ file sao lưu
} finally {
  setTimeout(function(){ var s=document.getElementById('splashScreen'); if(s) s.classList.add('hide'); }, 400);
}
```
Vì sao tốt nhất: dù đã có Fix 1.1, vẫn có thể còn lớp hỏng khác (vd `sess.dateISO` thiếu nhưng vẫn là object → lọt filter). `finally` đảm bảo splash LUÔN ẩn → app không bao giờ "brick" hoàn toàn.

### Fix 1.3 — Gọi `runIntegrityCheck()` ngay ở boot (🟠 N21)
Vấn đề: `runIntegrityCheck()` (cơ chế tự chữa lành có sẵn, dòng ~2986) hiện chỉ chạy sau Restore JSON/Sheets + khi mở tab Lịch sử — KHÔNG chạy lúc boot bình thường → orphan `customOverrides`, trùng `customExercises`... không được dọn trước lần render đầu.

Phương án: gọi ngay trong khối try ở Fix 1.2, ngay sau `loadState()` (đã thể hiện ở code mẫu trên).

Vì sao tốt nhất: ngang bằng luồng Restore (vốn đã saveState→integrity→render), dọn rộng hơn phạm vi null-history. Rẻ, không rủi ro phụ.

### Fix 1.4 — `loadState` phân biệt hỏng vs lần-đầu: sao lưu raw hỏng + banner (🟠 N20)
Vấn đề: `loadState()` (dòng ~968–991) trả `false` cho CẢ first-run (dòng ~971, chưa có `saved`) LẪN dữ liệu hỏng (catch dòng ~987–990) — không phân biệt được. Boot bỏ qua giá trị trả về → dữ liệu hỏng bị âm thầm thay bằng state rỗng → thao tác ghi tiếp theo đè mất bản gốc còn cứu được.

Phương án (sửa trong khối `catch` của `loadState` — nơi CHẮC CHẮN là dữ liệu hỏng, không phải first-run):
```js
}catch(e){
  console.warn('Đọc dữ liệu thất bại:', e);
  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ localStorage.setItem('sogym_data_v1_corrupt_' + Date.now(), raw); }  // cứu bản gốc TRƯỚC KHI có gì ghi đè
  }catch(_){}   // nếu quota đầy cũng không được chặn banner
  showLoadErrorBanner();   // "Không đọc được dữ liệu cũ — đã giữ 1 bản sao. Hãy Khôi phục từ file sao lưu TRƯỚC khi nhập mới."
  return false;
}
```
Vì sao tốt nhất: sao-lưu-trước-khi-đè chống mất dữ liệu không phục hồi; bắn banner TỪ TRONG catch (nơi duy nhất biết chắc là hỏng) tránh báo động giả cho người dùng mới (first-run không bao giờ vào catch). Phương án "kiểm tra return value ở dòng 3211" bị nhập nhằng (first-run cũng trả false) → yếu hơn hẳn.

### Fix 1.5 — Thêm `reader.onerror` / `reader.onabort` cho Restore JSON (🟡 N20)
Vấn đề: FileReader trong luồng Restore JSON (dòng ~2593–2644) chỉ có `onload`; lỗi đọc file ở tầng OS/trình duyệt = im lặng hoàn toàn, nút Restore trông như "đơ"; `restoreFile.value` không được xoá nên chọn lại đúng file đó lần 2 không kích hoạt sự kiện `change`.

Phương án:
```js
reader.onerror = reader.onabort = function(){
  showAppAlert('Không đọc được file sao lưu. Hãy thử lại.');
  document.getElementById('restoreFile').value = '';
};
```
Vì sao tốt nhất: khớp đúng pattern reset value đã có sẵn ở `finally` của `onload`; tối thiểu, đủ, không cần phương án khác.

### Fix 1.6 — Guard `id` rỗng trong `thumbHTML` (🟡 C6)
Vấn đề: `thumbHTML(undefined)` (khi `ex.catalogId` thiếu — dữ liệu cũ trước khi có field này) sinh URL `.../undefined/0.jpg`, bị Service Worker cache lại vĩnh viễn dưới dạng opaque response.

Phương án:
```js
function thumbHTML(id){
  if(!id) return '<img src="'+FALLBACK_THUMB_SRC+'" alt="" loading="lazy">';
  return '<img src="'+IMG_BASE+id+'/0.jpg" alt="" loading="lazy" onerror="this.onerror=null;this.src=FALLBACK_THUMB_SRC;">';
}
```
Vì sao tốt nhất: 1 guard tại 1 hàm che tất cả call site (3 nơi gọi `thumbHTML`, cả 3 đều ĐÚNG với dữ liệu hiện tại — xem đính chính finding Nhóm 9 gốc trong PHẦN C mục C6 của report) + mọi lớp dữ liệu cũ/tương lai. Việc dọn entry cache `.../undefined/...` ĐÃ tồn tại trong Cache Storage thì dời sang Batch 3 (đụng SW) để không trộn phạm vi — ở Batch 1 chỉ chặn KHÔNG SINH THÊM entry mới.

### Fix 1.7 — Restore: chuẩn hoá payload đến TRƯỚC khi ghi (validate-then-commit) (🟡 C5)
Vấn đề: luồng Restore JSON hiện ghi `state` + gọi `saveState()` (dòng ~2617) RỒI MỚI chạy `runIntegrityCheck()` (~2622) và render (~2630) — nếu có lớp hỏng lọt qua và render throw (bị bắt ở catch ~2633), dữ liệu local (đã bị thay thế) coi như mất, không cứu được.

Phương án: ngay sau `data = migrateData(data)` (dòng ~2601), gọi thêm `normalizeDataModelV3(data)` NGAY TRÊN PAYLOAD ĐẾN, trước khi gán bất kỳ field nào vào `state`:
```js
data = migrateData(data);
if(!data){ await showAppAlert('File sao lưu không có cấu trúc dữ liệu hợp lệ.'); return; }
normalizeDataModelV3(data);   // lọc null NGAY trên dữ liệu file, TRƯỚC khi commit vào state
if(!(await showAppConfirm('Khôi phục sẽ THAY THẾ toàn bộ dữ liệu hiện tại...'))) return;
state.sessionStarted = !!data.sessionStarted;
... (giữ nguyên phần còn lại)
```
Vì sao tốt nhất: biến luồng Restore thành "làm sạch trước, ghi sau" bằng đúng chốt chung của Fix 1.1 — kết hợp với `finally` ở Fix 1.2 và `runIntegrityCheck` ở Fix 1.3, luồng Restore trở nên an toàn mà không cần phát minh cơ chế mới. (Restore vẫn là hành động thay-thế mà user đã tự confirm qua `showAppConfirm`; Google Sheets vẫn giữ nhiều dòng backup cũ để cứu nếu cần.)

### Ghi chú thực thi Batch 1
- Cần thêm 2 banner nhỏ cho Fix 1.2 (`showBootErrorBanner`) và Fix 1.4 (`showLoadErrorBanner`) — có thể tái dùng `#saveErrorBanner` với text khác, hoặc tạo phần tử riêng để thông điệp rõ ràng hơn (khuyến nghị tạo riêng).
- Nguyên tắc xuyên suốt Batch 1: sửa tại GỐC/CHỐT CHUNG (Fix 1.1, 1.7) + bảo đảm KHÔNG-BRICK app (Fix 1.2) + KHÔNG MẤT dữ liệu (Fix 1.4) — thay vì vá triệu chứng từng chỗ riêng lẻ.

---

## 7. Việc CẦN LÀM khi resume ở máy mới

1. Đọc file này (đã làm, nếu đang đọc tới đây).
2. Đọc `QA/SoGym_FinalAudit_Buoc1_Report.md` (PHẦN A + B + C) để có đầy đủ ngữ cảnh finding.
3. Tóm tắt lại ngắn gọn cho user: "Bước 1 xong, Bước 2 Batch 1 đã có đề xuất (xem mục 6 ở trên) — anh xác nhận để tôi sang Bước 3?"
4. Chờ user xác nhận RÕ RÀNG bằng lời (không tự suy đoán) trước khi tạo `SoGym_A_Final_WIP.html` và sửa code.
5. Từ đó theo đúng quy trình mục 3 ở trên: Bước 3 → Bước 4 (regression riêng Batch 1) → trình Batch 2 (Bước 2) → ... cho tới hết 5 batch → Bước 5 (performance, sau Batch 2 + tổng cuối) → Bước 6 (before/after) → deliverable cuối (`SoGym_A_Final_Optimized_v1.html` + report), chỉ tạo 1 lần duy nhất ở cuối.
6. KHÔNG tạo file trung gian versioned mỗi batch. KHÔNG đụng `QA/SoGym_Roadmap_TongQuan.md`. Nếu cần ghi tiến độ persistent, ghi vào `sogym_roadmap.md` (memory) — nhưng lưu ý file memory này KHÔNG nằm trong folder project, nên nếu máy mới chưa có, hãy hỏi user hoặc ghi bổ sung vào chính file handoff này thay thế tạm.

**Hết file handoff.**
