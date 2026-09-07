# Sổ Gym v23 — QA Audit Phase 1 (CHỈ AUDIT, KHÔNG SỬA CODE)

- **File kiểm tra:** `SoGym_A_Final_Optimized_v23.html` (2.064.394 bytes) + `SoGym_A_Final_Optimized_SW_v1.js`
- **Bản live:** https://nguyenkhoiduongtu90.github.io/sogym/SoGym_A_Final_Optimized_v23.html
- **Ngày audit:** 2026-09-07
- **Phạm vi (do user chốt):** Phase 1 — chỉ audit, tuyệt đối không sửa code. Trọng tâm = vùng thay đổi v14→v23.
- **Cách kiểm tra:** đọc toàn bộ diff v13→v23 + chạy thật trong Chromium (Claude Preview MCP) tại `http://localhost:8934`. Mọi mục 🔴/🟠/🟡 bên dưới đều **đã tái hiện được bằng test chạy thật**, không có mục nào chỉ suy luận từ code.
- **Chưa test trên iPhone thật** — toàn bộ kết quả lấy từ Chromium desktop giả lập viewport 375×812 và 430×932.

---

## Bảng tóm tắt

| # | Mức | Tên lỗi | Vùng |
|---|-----|---------|------|
| 1 | 🔴 Critical | Mất dữ liệu thầm lặng sau **một** lần ghi localStorage thất bại | Multi-tab guard (v17) |
| 2 | 🟠 High | `resyncFromOtherTab()` không vẽ lại màn "Nhập set" → màn hình chết | Multi-tab guard (v17) |
| 3 | 🟠 High | Service Worker offline trả về **bản HTML CŨ NHẤT** trong cache | SW cache |
| 4 | 🟠 High | Màn "Chọn bài" nhét 873 bản sao base64 của cùng 1 icon → innerHTML 6,6 MB | Hiệu năng picker |
| 5 | 🟡 Medium | Ô số nguyên nuốt dấu phẩy: `30,5` phút → `305` phút | Nhập liệu số (v22) |
| 6 | 🟡 Medium | Nhiều banner cùng đè lên nhau ở đúng `top:22px` | Layout banner |
| 7 | 🟡 Medium | Đổi "Loại thiết bị" không dọn `equipDetail` → hiển thị mâu thuẫn | Sửa thiết bị (v15) |
| 8 | 🟢 Low | Excel: 2 bài trùng tên khác id thành 2 dòng không phân biệt được | Xuất Excel |
| 9 | 🟢 Low | `suggestedRestForExercise()` chưa dùng `exerciseGroupKey()` như v18 | Đồng hồ nghỉ |
| 10 | 🟢 Low | `forceConsent` bị bỏ qua khi đang có lượt xin token dở dang | OAuth (v19) |
| 11 | 🔵 Cosmetic | Header Google Sheet mới tạo chỉ có 2 cột, dữ liệu v23 ghi 3 cột | Sao lưu Sheets (v23) |
| 12 | 🔵 Cosmetic | 68/873 bài hiển thị "X — X" (nhóm thiết bị trùng chi tiết thiết bị) | Catalog |
| 13 | 🔵 Cosmetic | Dải trạng thái mạng chiếm 22px vĩnh viễn kể cả khi Online | Net-status |

---

## 🔴 1. Mất dữ liệu thầm lặng sau MỘT lần ghi localStorage thất bại

**Nguyên nhân gốc** — `SoGymDataStore.write()`, dòng 1018–1025:

```js
write: function(payload){
  var data = migrateData(payload);
  this.lastRaw = JSON.stringify(data);   // ← gán mốc TRƯỚC khi ghi
  localStorage.setItem(this.key, this.lastRaw);   // ← nếu dòng này ném lỗi...
  return true;
}
```

`lastRaw` được chốt **trước** khi `setItem` thành công. Chỉ cần `setItem` ném lỗi đúng 1 lần (bộ nhớ đầy, Safari private mode, iOS thu hồi quota), `lastRaw` giữ chuỗi MỚI trong khi localStorage vẫn giữ chuỗi CŨ → hai mốc lệch nhau vĩnh viễn cho tới lần resync tiếp theo.

Lần `saveState()` kế tiếp (dù bộ nhớ đã bình thường trở lại) rơi vào nhánh chống-đè-đa-tab ở dòng 1195–1200:

```js
var currentRaw = localStorage.getItem(SoGymDataStore.key);
if(currentRaw !== null && currentRaw !== SoGymDataStore.lastRaw){
  resyncFromOtherTab();   // loadState() → nạp lại DỮ LIỆU CŨ đè lên RAM
  return false;
}
```

**Tái hiện thật (log từ Chromium):**

```
save#1 = true
sets sau save#1 = 2
save#2 (bộ nhớ đầy, mô phỏng QuotaExceededError đúng 1 lần) = false
localStorage === lastRaw ? false          ← mốc đã lệch
sets trong RAM trước save#3 = 4
save#3 = false
sets trong RAM SAU save#3 = 2             ← MẤT 2 SET
banner đa tab hiển thị = block            ← thông báo SAI sự thật
```

**Tác động:** người dùng tập tiếp sau khi thấy banner "bộ nhớ đầy", app âm thầm quay ngược toàn bộ set đã nhập kể từ lần ghi hỏng, đồng thời hiện thông báo "Đang mở ở tab khác" — hoàn toàn không đúng nguyên nhân, khiến người dùng không biết mình vừa mất dữ liệu và cũng không biết phải sao lưu.

---

## 🟠 2. `resyncFromOtherTab()` không vẽ lại màn "Nhập set" → màn hình chết

**Nguyên nhân gốc** — `resyncFromOtherTab()`, dòng 1258–1268, vẽ lại home / history / picker / ring / body nhưng **không** gọi `renderSetRows()` và không rời khỏi `screen-log`:

```js
function resyncFromOtherTab(){
  loadState();
  populateSubgroupFilter();
  renderHome(); renderHistory(); renderPicker && (...picker...);
  updateRingUI();
  if(document.getElementById('screen-body').classList.contains('active')) renderBodyScreen();
  ...
}
```

`state.currentLogIndex` cũng không được kiểm tra lại sau khi `state.sessionExercises` bị thay bằng mảng của tab kia.

**Tái hiện thật** (đang ở màn Nhập set, tab khác vừa kết thúc buổi tập → `sessionExercises = []`):

```
màn hiện tại = screen-log
save = false
màn sau resync = screen-log                     ← vẫn nằm nguyên màn nhập set
sessionExercises còn = 0, currentLogIndex = 0   ← trỏ vào phần tử không tồn tại
số dòng set còn hiển thị = 2                    ← DOM vẫn là dữ liệu CŨ
renderSetRows() NÉM LỖI: Cannot read properties of undefined (reading 'sets')
```

**Tác động:** màn hình đứng ở trạng thái sai lệch, hiển thị set của bài đã biến mất; mọi thao tác tiếp theo (log set, xoá set, đổi bài) đều ném `TypeError` → phải tải lại trang. Đi kèm lỗi #1 ở trên, đây là đường dẫn thực tế nhất để người dùng gặp sự cố.

---

## 🟠 3. Service Worker offline trả về bản HTML CŨ NHẤT trong cache

**Nguyên nhân gốc** — `SoGym_A_Final_Optimized_SW_v1.js` dòng 111–113:

```js
var allKeys = await cache.keys();
var anyHtml = allKeys.find(function(k){ return k.url.endsWith('.html'); });
if(anyHtml) return cache.match(anyHtml);
```

`cache.keys()` trả theo **thứ tự chèn** (cũ → mới), `find()` lấy phần tử ĐẦU TIÊN ⇒ luôn là bản HTML cũ nhất còn trong cache. Ngoài ra `cache.match(req)` không dùng `ignoreSearch`, nên URL có query string (`?utm_source=`, `?fbclid=` từ link chia sẻ Zalo/Messenger) là cache-miss, và `.endsWith('.html')` cũng false với URL có query.

**Tái hiện thật** (dựng cache theo đúng thứ tự dùng v21 → v22 → v23):

```
cacheOrder            = [v21.html, v22.html, v23.html]
exactMatchForQueryUrl = false        (URL ...v23.html?utm_source=zalo)
fallbackServes        = SoGym_A_Final_Optimized_v21.html   ← chạy bản CŨ
```

**Tác động:** mở app offline qua link có tham số → chạy phiên bản cũ hơn nhưng đọc dữ liệu localStorage đã ở schema mới, không có bất kỳ cảnh báo nào. Người dùng tưởng đang dùng v23. `GENERAL_CACHE_MAX_ENTRIES = 30` × ~2 MB/bản HTML ⇒ cache chung có thể phình tới ~62 MB và giữ rất nhiều đời bản cũ.

---

## 🟠 4. Màn "Chọn bài" nhét 873 bản sao base64 của cùng 1 icon

**Đo thật trong Chromium desktop:**

| Từ khoá gõ vào ô tìm kiếm | Số dòng | Số `<img>` | Thời gian `renderPicker()` |
|---|---|---|---|
| (rỗng) | 1 | 0 | 5,0 ms |
| `a` | **873** | **1746** | **60,6 ms** |
| `ba` | 225 | 450 | 19,6 ms |
| `bang ta` | 3 | 6 | 4,5 ms |

```
favBase64Chars      = 6978        ← mỗi dòng nhúng 1 chuỗi base64 6.978 ký tự
pickerListHtmlChars = 6.615.598   ← innerHTML 6,6 MB cho 873 dòng
estFavShare         = 92,1%       ← 92% khối lượng HTML là 873 bản sao CÙNG 1 icon
```

Ảnh thumbnail đã có `loading="lazy"` (tốt, không gây bão request), nhưng icon "yêu thích" là data-URI base64 nhúng thẳng vào chuỗi HTML, lặp lại nguyên vẹn 873 lần. Không có debounce trên `#searchInput` ⇒ chi phí này trả **mỗi lần gõ một ký tự**.

**Tác động:** gõ 1 ký tự phổ biến (`a`, `e`, `n`…) tạo chuỗi HTML 6,6 MB và mất ~60 ms trên desktop. Trên iPhone (CPU chậm hơn 3–5×) ước tính 200–300 ms/phím → gõ tìm bài sẽ giật rõ rệt. **Chưa test trên iPhone thật.**

---

## 🟡 5. Ô số nguyên nuốt dấu phẩy: `30,5` phút → `305` phút

v22 đã xử lý dấu phẩy cho các ô thập phân, nhưng ô số nguyên vẫn xoá phẳng dấu phẩy thay vì chặn/cảnh báo.

**Tái hiện thật:**

| Ô | Gõ vào | Kết quả |
|---|---|---|
| `cardioMin` | `30,5` | `305` ❌ |
| `inpReps` | `10,5` | `105` ❌ |
| `inpReps` | `1.2` | `12` ❌ |
| `inpWeight` | `62,5` | `62.5` ✅ |
| `cardioKm` | `5,2` | `5.2` ✅ |
| `bodyWeightInp` | `70,5` | `70.5` ✅ |

**Tác động:** người Việt gõ `,` làm dấu thập phân theo phản xạ. `30,5` phút cardio biến thành **305 phút (hơn 5 tiếng)** một cách im lặng, làm hỏng số liệu thống kê và biểu đồ. Đây là lỗi nhập liệu dễ xảy ra nhất trong danh sách này.

---

## 🟡 6. Nhiều banner cùng đè lên nhau ở đúng `top:22px`

Cả 5 banner đều `position:fixed; top:22px` với z-index gần nhau (`bootError` 60, `saveError`/`loadError` 50, `multiTab`/`staleSession` 49).

**Tái hiện thật (viewport 375×812), khi 3 banner cùng bật:**

```
saveErrorBanner     y=22  h=20  z=50
multiTabBanner      y=22  h=57  z=49
staleSessionBanner  y=22  h=22  z=49
```

Ảnh chụp xác nhận: banner z=50 che gần hết banner cam phía dưới, chỉ lộ một vạch chữ bị cắt; `multiTabBanner` và `staleSessionBanner` cùng z=49 nên thứ tự phụ thuộc DOM. Ngoài ra banner là `fixed` nên không đẩy nội dung xuống — chúng che luôn tiêu đề "Hôm nay" và dòng ngày của app.

**Tác động:** đúng lúc có nhiều sự cố cùng lúc (lưu hỏng + đa tab) thì người dùng chỉ đọc được 1 thông báo, thường không phải cái quan trọng nhất.

---

## 🟡 7. Đổi "Loại thiết bị" không dọn `equipDetail`

`resolvedEquipmentDisplay()` ghép `resolvedEquipGroup(ex) + ' — ' + resolvedEquipDetail(ex)`, nhưng listener v15 (dòng 2058–2062) chỉ ghi override cho `equipGroup`, không đụng `equipDetail`.

**Tái hiện thật:**

```
id       = Decline_Smith_Press
trước    = "Máy Smith — Máy Smith"
đổi nhóm thiết bị → "Không cần máy"
sau      = "Không cần máy — Máy Smith"     ← tự mâu thuẫn
lưu vào localStorage: {"equipGroup":"Không cần máy"}   ✅ (phần lưu đúng)
```

**Xác nhận PASS kèm theo:** bộ lọc chip thiết bị dùng đúng `resolvedEquipGroup(ex)` nên bài vẫn nhảy sang đúng nhóm sau khi đổi; override lưu và đọc lại đúng.

---

## 🟢 8. Excel: 2 bài trùng tên khác id thành 2 dòng không phân biệt được

Với 2 bài catalog khác nhau nhưng cùng tên hiển thị "Đẩy ngực", sheet `prRows` và `aggRows` sinh 2 dòng giống hệt cột tên:

```
prRows:  ["Đẩy ngực", 105, "03/09/2026", 105, 100, "Có"]
         ["Đẩy ngực",  20, "01/09/2026",  20,  20, "Có"]
```

Không có cột id/thiết bị để phân biệt. `setRows` cùng ngày cũng có 2 khối "Đẩy ngực" với `Set #` đếm lại từ 1.

**Ghi chú quan trọng — đã bác bỏ nghi vấn cũ:** vòng audit trước từng nghi cột "@ Reps" bị lẫn giữa 2 bài trùng tên. **Test lại trên v23 cho thấy KHÔNG có lỗi này** — `@ Reps` khớp đúng từng bài (100 kg → @3, 20 kg → @15) ở cả trường hợp có `catalogId` lẫn lịch sử cũ không có `catalogId`. Fix identity v18 đã bao phủ đúng. Lỗi còn lại thuần tuý là trình bày.

---

## 🟢 9. `suggestedRestForExercise()` chưa dùng `exerciseGroupKey()`

Dòng 2163–2175 vẫn so khớp thô `if(ex.catalogId !== catalogId) return;`, trong khi toàn bộ phần còn lại đã chuyển sang `exerciseGroupKey(ex) = ex.catalogId || ex.id || ex.name` (fix v18).

**Tái hiện thật:** với lịch sử cũ không có `catalogId`, `suggestedRestForExercise(undefined)` trả `{seconds:60, fromHistory:false}` — bỏ qua toàn bộ `restUsed` đã có trong lịch sử. Không crash, chỉ mất tính năng gợi ý.

---

## 🟢 10. `forceConsent` bị bỏ qua khi đang có lượt xin token dở dang

Dòng 3608–3612:

```js
if(gsheetAccessToken && !forceConsent) return gsheetAccessToken;
if(gsheetTokenInFlight) return gsheetTokenInFlight;   // ← không xét forceConsent
```

Nếu một lượt `requestAccessToken({prompt:''})` đang chạy dở mà người dùng bấm chức năng cần `prompt:'consent'`, lượt sau ghép vào promise cũ và không bao giờ hiện màn hình xin quyền lại. Rất hiếm gặp (cần bấm trong đúng khoảng vài trăm ms), không gây mất dữ liệu.

---

## 🔵 11–13. Cosmetic

- **11.** `gsheetGetOrCreateSheetId()` (dòng 3678) tạo header chỉ 2 ô `Timestamp`, `JSON`, trong khi v23 ghi 3 cột `[ts, "i/n", mảnh]`. Ghi/đọc vẫn đúng (range `A:C`), nhưng người mở Sheet trực tiếp sẽ thấy cột C không có tiêu đề.
- **12.** 68/873 bài trong catalog có `equipGroup === equipDetail` nên hiển thị lặp "Máy chuyên biệt — Máy chuyên biệt".
- **13.** Dải `#netStatus` chiếm 22px cố định và `body { padding-top: 22px }` kể cả khi Online — mất 22px chiều cao vĩnh viễn trên màn hình điện thoại chỉ để hiện chữ "Online".

---

## Các hạng mục ĐÃ TEST và ĐẠT (không phải lỗi)

| Hạng mục | Bằng chứng |
|---|---|
| Chia mảnh Google Sheets (v23) | `gsheetChunkString` cắt đúng, không cắt giữa cặp surrogate; `gsheetBuildBackupRows` giữ dạng 2 cột khi ≤1 mảnh |
| Ghép mảnh khi khôi phục | 4 kịch bản biên đều đúng: ô index hỏng giữa cụm → vẫn ghép đúng `AABB`; 2 bản trùng ts → tách đúng 2 bản; dòng rác chen giữa → tách đúng; dòng legacy 2 cột xen giữa → đọc đúng, cụm hỏng bị loại an toàn |
| `valueInputOption=RAW` | Đã xác nhận — mảnh JSON bắt đầu bằng `-` hoặc `=` KHÔNG bị Sheets hiểu thành công thức |
| Fix identity v18 | `allTimeMaxByExercise` / `computeWorkoutTarget` tách đúng theo id: ex_1 → max 105 @4 reps, target 2×3 @102 kg; ex_2 → max 20 @15 reps, target 1×15 @20 kg |
| Ô số thập phân (v22) | `62,5` → `62.5`; `5,2` → `5.2`; `70,5` → `70.5` |
| Dải trạng thái mạng | Đổi đúng: chấm `rgb(198,255,61)` + "Online" ⇄ chấm `rgb(255,107,74)` + "Mất mạng"; đúng ở cả 375px và 430px |
| Ghi override thiết bị (v15) | Lưu đúng vào `customOverrides`, bộ lọc chip cập nhật đúng |
| Đăng ký Service Worker | Đăng ký thành công, `activated`, 3 cache đúng tên (`sogym-cache-v4`, `sogym-images-v1`, `sogym-splash-v1`), file SW HTTP 200 |
| `migrateData` / `normalizeDataModelV3` | Được gọi ở cả `loadState()` (dòng 1225) và `saveState()` (dòng 1182); dữ liệu legacy thiếu `catalogId` không gây crash nhờ fallback theo tên |
| Hiệu năng `getSubgroupSuggestionOptions()` | 0,1 ms/lần trên 873 bài — nghi vấn hiệu năng cũ bị bác bỏ |
| Catalog | 873 bài, đúng 4 giá trị `equipGroup` |

---

## Chưa kiểm tra được trong vòng này

- **Chưa test trên iPhone thật** — toàn bộ kết quả từ Chromium desktop. Cần xác nhận lại trên iOS Safari: hiệu năng màn "Chọn bài" (mục 4), hành vi quota localStorage kích hoạt lỗi #1, cài PWA vào màn hình chính, đường sao lưu Google Sheets qua popup OAuth trong chế độ standalone.
- Đường sao lưu/khôi phục Google Sheets **thật** (cần tài khoản Google + popup OAuth) — vòng này chỉ test được logic chia/ghép mảnh ở mức hàm.
- Hành vi offline thật với ngắt mạng vật lý — mục 3 được chứng minh bằng cách mô phỏng chính xác logic fallback của SW trên Cache Storage thật.

---

## Đề xuất thứ tự xử lý cho Phase 2 (chưa thực hiện — chờ duyệt)

1. Lỗi #1 + #2 (cùng vùng multi-tab guard, nên sửa chung 1 lượt)
2. Lỗi #5 (rủi ro sai số liệu cao, sửa rất nhỏ)
3. Lỗi #3 (Service Worker — chọn bản HTML mới nhất + `ignoreSearch`)
4. Lỗi #4 (tách icon base64 ra CSS/sprite + debounce ô tìm kiếm)
5. Lỗi #6, #7
6. Nhóm 🟢/🔵 gộp cuối

**Chưa sửa bất kỳ dòng code nào.** Chờ user duyệt trước khi bắt đầu Phase 2 (dựng v24).
