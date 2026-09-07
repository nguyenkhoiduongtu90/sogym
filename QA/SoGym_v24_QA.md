# Sổ Gym v24 — QA Phase 2 (SỬA LỖI + TEST XÁC NHẬN)

- **File deliverable:** `SoGym_A_Final_Optimized_v24.html` (2.182.818 bytes) + `SoGym_A_Final_Optimized_SW_v2.js` (14.985 bytes, **file MỚI**)
- **Mốc so sánh:** `SoGym_A_Final_Optimized_v23.html` (2.164.944 bytes) + `SoGym_A_Final_Optimized_SW_v1.js` — **cả hai KHÔNG bị sửa**
- **Đầu vào:** `QA/SoGym_v23_QA_Audit_Phase1.md` (13 phát hiện)
- **Ngày:** 2026-09-07
- **Phạm vi (user chốt):** sửa 12/13 phát hiện. Phát hiện **13** (dải trạng thái mạng 22px) → **GIỮ NGUYÊN**, cố ý không đụng.
- **Cách test:** chạy thật trong Chromium (Claude Preview MCP) tại `http://localhost:8934`. **Không mục nào được kết luận PASS chỉ bằng đọc code.**
- **Chưa test trên iPhone thật** — toàn bộ kết quả từ Chromium desktop.

### 3 quyết định sản phẩm do user chốt trước khi sửa

1. **Dấu phẩy ở ô số nguyên** → *cả `cardioMin` và `inpReps` đều CẮT phần lẻ* (`30,5` → `30`; `10,5` → `10`). Không đổi `cardioMin` thành ô thập phân.
2. **Dải trạng thái mạng** → *giữ nguyên như hiện tại* (phát hiện 13 ngoài phạm vi).
3. **Excel** → *thêm cột "Thiết bị"* vào sheet PR và sheet tổng hợp theo bài-ngày.

---

## Bảng kết quả

| # | Mức | Lỗi | Trạng thái |
|---|-----|-----|-----------|
| 1 | 🔴 | Mất dữ liệu sau 1 lần `setItem` thất bại | ✅ PASS |
| 2 | 🟠 | `resyncFromOtherTab()` làm chết màn Ghi log | ✅ PASS |
| 3 | 🟠 | SW offline trả về bản HTML CŨ NHẤT | ✅ PASS |
| 4 | 🟠 | Picker nhúng 1746 ảnh base64 → innerHTML 6,6 MB | ✅ PASS |
| 5 | 🟡 | Ô số nguyên nuốt dấu phẩy: `30,5` → `305` phút | ✅ PASS |
| 6 | 🟡 | Nhiều banner đè lên nhau tại `top:22px` | ✅ PASS |
| 7 | 🟡 | Đổi "Loại thiết bị" không dọn `equipDetail` | ✅ PASS |
| 8 | 🟢 | Excel: 2 bài trùng tên khác id không phân biệt được | ✅ PASS |
| 9 | 🟢 | `suggestedRestForExercise()` chưa dùng `exerciseGroupKey()` | ✅ PASS |
| 10 | 🟢 | `forceConsent` bị bỏ qua khi có lượt xin token dở dang | ✅ PASS |
| 11 | 🔵 | Header Google Sheet mới tạo chỉ có 2 cột | ✅ PASS |
| 12 | 🔵 | 68/873 bài hiển thị "X — X" | ✅ PASS |
| 13 | 🔵 | Dải trạng thái mạng 22px | ⬜ CỐ Ý BỎ QUA (user chốt) |

---

## Chi tiết từng fix + bằng chứng test

### 🔴 1 — `SoGymDataStore` chốt `lastRaw` sau khi `setItem` thành công

`read()`/`write()` chỉ gán `this.lastRaw = raw` **sau khi** `localStorage.setItem()` trả về.

| | v23 | v24 |
|---|---|---|
| `save#1` (2 set) | `true` | `true` |
| `save#2` (mô phỏng QuotaExceeded) | `false` | `false` |
| `lastRaw` khớp localStorage? | ❌ lệch | ✅ khớp |
| `save#3` (quota đã bình thường) | `false` | `true` |
| Số set còn lại | **2 (mất 2 set)** | **4 (giữ đủ)** |
| Banner đa-tab hiện nhầm | có | không |

### 🟠 2 — `resyncFromOtherTab()` vẽ lại màn Ghi log đang mở

- **Case A** (tab khác xoá sạch buổi tập): v24 chuyển về `screen-home`, **0 lỗi**. v23 throw ở `renderSetRows()`.
- **Case B** (index còn hợp lệ): tiêu đề cập nhật thành *"Đẩy ngực (tab khác đã sửa)"*, vẽ đủ 3 hàng set, và **`restStillRunning: true`**.

> Cố ý **không** gọi `openLog()` vì hàm đó gọi `resetRestTimer()` — sẽ giết đồng hồ nghỉ đang chạy nền.

### 🟠 3 — Service Worker chọn đúng bản HTML khi offline

Sửa trong **file mới** `SoGym_A_Final_Optimized_SW_v2.js`. `SW_v1.js` **giữ nguyên vĩnh viễn** (vẫn phục vụ mọi bản HTML cũ đã confirm OK). 3 tên cache giữ nguyên — đổi tên sẽ khiến `activate()` xoá sạch bản offline người dùng đang có.

Hai nguyên nhân, sửa cả hai:
- `.find()` trả phần tử **đầu** của `cache.keys()` = file HTML **cũ nhất** → nay lọc rồi lấy phần tử **cuối**.
- `k.url.endsWith('.html')` sai khi URL có query string → nay xét `pathname`.
- Thêm một lượt `cache.match(req, {ignoreSearch:true})` **trước** khi rơi xuống nhánh dự phòng. Lượt này cố ý **không** touch, vì `cache.put(req)` với query khác sẽ tạo entry mới thay vì cập nhật entry cũ.

**Cách test:** chạy **chính mã nguồn SW đã ship** (fetch `cache:'no-store'`) trong `new Function(...)` với `fetch` bị ép reject (`TypeError`), Cache Storage thật, request giả `mode='navigate'`. Cache mồi theo thứ tự chèn `[v21, v22, v23, v24]`.

| Kịch bản | SW_v1 (v23) | SW_v2 (v24) |
|---|---|---|
| Offline, URL có query `?cb=999` | **v21** ❌ | **v24** ✅ |
| Offline, URL hoàn toàn mới | **v21** ❌ | **v24** ✅ |
| Online nạp v23 → rồi offline URL mới | — | **v23** ✅ (bản vừa dùng, không phải v24) |
| Cache không còn file `.html` nào | — | HTTP **503** + thông báo tiếng Việt, không crash ✅ |

> **Lưu ý quan trọng — một thay đổi đã bị GỠ BỎ sau khi đo thật.** Ban đầu tôi đổi `cache.put()` ở nhánh online thành `touchCacheEntry()` (delete rồi put), kèm chú thích *"put() ghi đè TẠI CHỖ nên entry giữ nguyên vị trí"*. **Đo thật trên Chromium cho thấy câu đó SAI:** `cache.put()` lên key đã tồn tại **tự động đẩy entry xuống cuối** thứ tự chèn (đúng spec: put = delete rồi append).
>
> ```
> Cache ban đầu:            [a, b, c]
> Sau c.put('/a', ...):     [b, c, a]   ← put() ĐÃ tự đẩy xuống cuối
> ```
>
> SW_v1 (dùng `cache.put` thẳng) và SW_v2 (dùng `touchCacheEntry`) cho **thứ tự cache y hệt nhau**. Thay đổi đó là **no-op**, chỉ tốn 2 thao tác cache thay vì 1. Đã **hoàn nguyên về `cache.put()`** và sửa lại chú thích cho đúng sự thật. Nhờ vậy SW_v2 chỉ khác SW_v1 **đúng 1 chỗ duy nhất** = nhánh dự phòng ngoại tuyến.
>
> Bẫy đã gặp khi test: SW thật đang điều khiển trang đã **chặn và cache luôn** các `window.fetch` của bộ test, làm sai lệch kết quả lần đo đầu. Đã gỡ registration + chuyển sang trang không có SW rồi mới đo lại.

### 🟠 4 — Picker: bỏ 1746 ảnh base64, thêm debounce

Icon sao đổi từ `<img src="data:image/png;base64,...">` thành `<span class="fav-icon">` ăn `background-image` từ **một** stylesheet `#favIconStyle` duy nhất.

| | v23 | v24 |
|---|---|---|
| Số hàng | 873 | 873 |
| Thẻ `<img>` | 1746 | **873** |
| Ảnh base64 | **1746** | **0** |
| `innerHTML` | **6.615.598 ký tự** | **534.045 ký tự** (−92%) |
| Thời gian render | 60,6 ms | **28,4 ms** |

Debounce 120 ms: gõ 5 phím liên tiếp → **0** lần render tức thì, **1** lần render sau khi ngừng gõ. Icon bật/tắt vẫn khác nhau (6985 vs 4261 ký tự), stylesheet 11.308 ký tự.

### 🟡 5 — Dấu phẩy ở ô số

Handler `input` nay quy `,` về `.` cho **mọi** ô số. Cắt phần lẻ tách thành `truncateIntegerField(el)` gọi ở **3 nơi**: sự kiện `blur`, `btnSaveCardio`, `btnLogSet`.

| Gõ vào | Ô | v23 | v24 |
|---|---|---|---|
| `30,5` | `cardioMin` | **305 phút** ❌ | **30 phút** ✅ |
| `10,5` | `inpReps` | **105 reps** ❌ | **10 reps** ✅ |
| `62,5` | `inpWeight` | 62.5 | **62.5** ✅ (giữ thập phân) |
| `5,4` | `cardioKm` | 5.4 | **5.4** ✅ (giữ thập phân) |

> **Phát hiện thêm trong lúc test:** `btnSaveCardio` **không hề có** kiểm tra số nguyên (chỉ kiểm `min > 0`), khác `btnLogSet` vốn có `Number.isInteger(reps)`. Nếu người dùng bấm Lưu mà ô chưa từng blur, `30.5` phút sẽ được lưu nguyên — sai với quyết định "cắt phần lẻ" của user. Đã bịt bằng cách gọi `truncateIntegerField()` ngay trong cả hai handler lưu, **không phụ thuộc vào sự kiện blur**.
>
> Bẫy môi trường test: trang preview có `document.hasFocus() === false` nên Chrome **không phát bất kỳ sự kiện `focus`/`blur` nào**; `el.focus()` chỉ đổi `activeElement` chứ không dispatch gì. Phải dùng `dispatchEvent(new FocusEvent('blur'))` để test handler blur.

### 🟡 6 — Gom banner vào `#bannerStack`

5 banner (`saveErrorBanner`, `multiTabBanner`, `staleSessionBanner`, …) bỏ hết `position:fixed; top; left; right; max-width; margin; z-index` riêng, đưa vào một flex column `#bannerStack`. `#restDoneBanner` **cố ý ở ngoài** stack (vẫn `top:50%`, `z-index:51`).

- Vị trí thực đo: y = **22 / 60 / 98 / 136 / 175** → `coBannerDeNhau: false`
- `#bannerStack` khi rỗng có `pointer-events:none` → chạm xuyên qua tới `.topbar` ✅
- Banner đang hiện vẫn nhận được chạm (`pointer-events:auto`) ✅

### 🟡 7 — Đổi nhóm thiết bị thì dọn `equipDetail`

`resolvedEquipDetail()` nay tôn trọng override **chuỗi rỗng** (`typeof o.equipDetail === 'string'`), thay vì bị `||` nuốt mất. Khi đổi `equipGroup` khác giá trị gốc → set `equipDetail = ''`; khi đổi **về lại** giá trị gốc → xoá hẳn override để chi tiết catalog hiện lại.

- `Decline_Smith_Press`: đổi nhóm → `"Không cần máy"` (không còn `"Không cần máy — Máy Smith"` mâu thuẫn) ✅
- Đổi ngược lại → khôi phục đúng chi tiết catalog ✅
- `Ab_Roller` round-trip → về lại `"Không cần máy — Chưa xác định"` ✅

### 🟢 8 — Excel: thêm cột "Thiết bị"

Thiết bị **không** có trong snapshot buổi tập (`{catalogId, name, sub, force, sets, done}`) nên phải tra ngược catalog lúc xuất, có memo hoá `equipLabelMemo` để không tra lặp.

Header mới:
- **Tổng hợp theo bài-ngày:** `Ngày | Bài tập (VI) | **Thiết bị** | Tổng Volume | …` (cột "@ Reps" đã dời index, đã kiểm tra lại)
- **PR:** `Bài tập (VI) | **Thiết bị** | Tạ cao nhất mọi thời điểm | …`

Kiểm chứng: 2 bài cùng tên "Đẩy ngực" nay phân biệt được qua `"Không cần máy — Tạ đòn"` vs `"Không cần máy — Tạ đơn"`.

Test end-to-end với dữ liệu thật vừa ghi (Chống đẩy 62,5kg × 10 reps):
```
aggRows[1] = ["07/09/2026", "Chống đẩy (Push-up)",
              "Không cần máy — Không dụng cụ (bodyweight)",
              625, 62.5, 10, 62.5, 10, 83.33, 10, 1, 10]
prRows[1]  = ["Chống đẩy (Push-up)",
              "Không cần máy — Không dụng cụ (bodyweight)",
              62.5, "07/09/2026", 62.5, 62.5, "Có"]
```
Volume 625 = 62,5 × 10 ✅ · 1RM 83,33 ✅ · cả 3 cột "@ Reps" (index 5/7/9) vẫn đúng sau khi dời index ✅ · lịch sử chưa có dữ liệu → 0 dòng, không crash ✅

> Bài cũ không có `catalogId` → ô "Thiết bị" **để trống**. Đây là hành vi đúng theo thiết kế: không bịa dữ liệu cho bài đã bị xoá khỏi catalog. `prNoiBatRows` cố ý giữ nguyên, không thêm cột.

### 🟢 9 — `suggestedRestForExercise()` dùng `exerciseGroupKey()`

Đổi từ so khớp theo **tên** sang `exerciseGroupKey(ex) = catalogId || id || name`, đồng bộ với v18. Hàm nhận thẳng object bài tập thay vì chuỗi tên; `resetRestTimer(exObj)` cập nhật theo.

| Trường hợp | v23 | v24 |
|---|---|---|
| Bài cũ không có `catalogId` (lịch sử 210s) | 60s (mặc định) ❌ | **210s** ✅ |
| Bài có `catalogId` | — | **120s** ✅ |
| Bài lạ / `null` | 60s | **60s** ✅ |

### 🟢 10 — `forceConsent` khi đang có lượt xin token dở dang

```
promptCalls: ['']                     ← lượt 1 đang chạy
promptCalls: ['']                     ← lượt 2 (forceConsent) CHỜ, chưa mở popup
promptCalls: ['', 'consent']          ← lượt 1 xong → lượt 2 mới mở popup consent
p1 = 'TOKEN_THUONG'  ≠  p2 = 'TOKEN_CONSENT'   ✅
```

> Cố ý **nối tiếp** (chain) chứ không chạy song song: `gsheetPendingResolve/Reject` là biến module-level, chạy 2 lượt song song sẽ ghi đè lẫn nhau khiến promise của lượt đầu **treo vĩnh viễn**.

### 🔵 11 — Header Google Sheet 3 cột

Sheet mới tạo nay có 3 ô header: `Timestamp` · `Mảnh (i/n) — hoặc JSON nếu bản chỉ có 1 mảnh` · `JSON (mảnh thứ i)`. Xác nhận bằng cách bắt body request tạo spreadsheet → **3 ô header**.

> **Định dạng GHI cố ý không đổi** (1 mảnh = 2 cột, nhiều mảnh = 3 cột) — đổi sẽ là scope creep và phá tương thích với bản sao lưu cũ. Vì vậy header phải mô tả trung thực **cả hai** định dạng thay vì dán nhãn sai cho cột B.

### 🔵 12 — Bỏ hiển thị "X — X"

`resolvedEquipmentDisplay()` nay chỉ trả `group` khi `detail.trim() === group.trim()`. Số bài hiển thị "X — X": **68 → 0** ✅

---

## Test hồi quy tổng thể (dữ liệu sạch từ 0)

Xoá sạch localStorage + Cache Storage + service worker, tải lại v24:

- Tiêu đề `Sổ Gym — Final Optimized v24`, màn hình `screen-home`, `bootErrorBanner` **rỗng** ✅
- `DATA_SCHEMA_VERSION = 3`, `#bannerStack` + `#favIconStyle` đều tồn tại ✅
- SW đăng ký đúng `SoGym_A_Final_Optimized_SW_v2.js` và đã claim ✅
- Luồng đầy đủ qua UI thật: Bắt đầu buổi → Thêm bài tập → tìm "Đẩy ngực" (**58 kết quả**) → chọn bài → thêm vào buổi → mở Ghi log → nhập `62,5` kg + `10,5` reps → Lưu set
  → set lưu đúng `{weight: 62.5, reps: 10, rm: 83.33}` ✅, `saveErrorBanner` ẩn ✅, dữ liệu có thật trong `localStorage['sogym_data_v1']` ✅
- Kết thúc buổi → vào lịch sử (1 buổi) → xuất sheet đúng như mục 8 ✅

**Đã dọn sạch toàn bộ dữ liệu test** sau khi xong (localStorage 0 key, 0 cache, 0 service worker).

---

## Ghi chú bàn giao

- `SoGym_A_Final_Optimized_v23.html`, `SoGym_A_Final_Optimized_SW_v1.js`, `SW.js` — **không bị đụng tới**.
- Mọi chú thích fix nằm ngay tại chỗ sửa, tìm theo chuỗi **`v24 — Fix Lỗi N`**.
- Phát hiện **13** vẫn còn nguyên trong v24 theo đúng quyết định của user.
- Chưa test trên iPhone thật — cần một vòng test thiết bị thật trước khi coi là chốt.
