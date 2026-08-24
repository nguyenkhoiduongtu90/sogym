# Sổ Gym — Final Audit Bước 6: So sánh BEFORE vs AFTER

**Ngày đo:** 2026-08-24
**BEFORE (baseline gốc trước audit):** `SoGym_A9_v4.html` + `SW_A7_v2.js`
**AFTER (sau khi áp toàn bộ 5 batch fix — Batch 1–5):** `SoGym_A_Final_WIP.html` + `SW_A_Final_WIP.js`

## Phương pháp đo

- Đo qua Claude Preview MCP (Chromium, Python `http.server` tĩnh phục vụ cả project trên cổng 8934, config `.claude/launch.json` → `sogym-static`).
- Vì 2 file HTML được phục vụ cùng 1 origin (`http://localhost:8934`), chúng dùng chung `localStorage` — tận dụng điều này để seed **đúng 1 bộ dữ liệu giống hệt nhau** rồi đo lần lượt trên từng bản, đảm bảo so sánh công bằng (apple-to-apple), không phải đoán.
- Dữ liệu test: bộ dữ liệu tổng hợp seed thủ công — **80 buổi tập** (4–6 bài/buổi, 3–4 set/bài), **60 dòng cơ thể**, **60 dòng dinh dưỡng**, tổng ~126.8KB JSON trong `localStorage` — mô phỏng 1 user dùng app lâu dài, KHÔNG phải trạng thái rỗng, để bộc lộ đúng chi phí render/boot thực tế mà audit đã cảnh báo (N14/Fix 3.3).
- Sau khi đo xong, dữ liệu test đã được xoá khỏi `localStorage` (không để lại rác trong môi trường test).
- Tất cả số đo là kết quả **thực đo qua DevTools Performance API** (Navigation Timing, `performance.now()`, `performance.memory`), không phải ước tính lý thuyết.
- Bước 5 (performance test) của quy trình gốc được gộp vào Bước 6 này — các số đo runtime dưới đây (mục 3–6) đồng thời đóng vai trò performance test có định lượng, theo đúng yêu cầu "Không được tuyên bố PASS nếu chưa có bằng chứng."

---

## 1. File size

| File | BEFORE | AFTER | Chênh lệch |
|---|---|---|---|
| HTML chính | `SoGym_A9_v4.html` — 4,773,403 bytes (~4.55 MB) | `SoGym_A_Final_WIP.html` — 2,000,224 bytes (~1.91 MB) | **−2,773,179 bytes (−58.1%)** |
| Service Worker | `SW_A7_v2.js` — 7,888 bytes | `SW_A_Final_WIP.js` — 12,165 bytes | +4,277 bytes (+54.2%) |
| Thư viện xuất Excel | Không có trên đĩa — tải từ CDN `cdn.sheetjs.com` mỗi lần cần, phụ thuộc mạng | `xlsx.full.min.js` — 951,904 bytes, tự host cùng thư mục, chỉ tải lần đầu bấm Xuất Excel, sau đó SW cache lại | +930KB trên đĩa, đổi lại Export hoạt động **offline** từ lần dùng thứ 2 |
| Ảnh mascot (7 ảnh không mặc định) | Nhúng base64 trong HTML (nằm trong 4.77MB ở trên) | File PNG riêng trong `pics/resized/`, tổng 2,093,180 bytes (~2.04MB) trên đĩa, **không** nhúng trong HTML | Chỉ tải khi randomizer chọn trúng (7/8 khả năng mỗi lần mở app); `mascot_01` (mặc định) vẫn giữ base64 inline để splash luôn có ảnh ngay từ frame đầu |

**Vì sao:** giảm 58.1% dung lượng HTML gần như hoàn toàn nhờ external hoá 6/7 ảnh mascot base64 (Fix 3.1) — trước đây các ảnh này được tải vô điều kiện ở **mọi** lần mở app dù 6/7 không bao giờ hiển thị (chỉ 1 ảnh được random chọn mỗi lần).

## 2. Số lượng code (line count)

| File | BEFORE | AFTER | Chênh lệch |
|---|---|---|---|
| HTML chính | 3,274 dòng | 3,473 dòng | +199 dòng |
| Service Worker | 148 dòng | 217 dòng | +69 dòng |

**Vì sao dòng tăng dù byte giảm mạnh:** phần lớn dung lượng cũ nằm trong vài dòng base64 cực dài (dòng dài nhất từng đo ~407,000 ký tự/dòng). Dòng thêm vào là code có cấu trúc (fix thật + comment giải thích theo đúng quy tắc dự án — không xoá code cũ, không rút gọn giải thích). Đây là dấu hiệu tốt: tỷ trọng "code đọc được" tăng, "dữ liệu nhị phân nhúng trong nguồn" giảm.

## 3. Startup / thời gian khởi động

Đo qua Navigation Timing API, **cold navigation** (tải lại hoàn toàn từ URL), cùng 1 bộ dữ liệu 80 buổi tập trong `localStorage`.

| Chỉ số | BEFORE | AFTER | Chênh lệch |
|---|---|---|---|
| Tải file qua mạng (`responseEnd`) | 115 ms | 53 ms | −62 ms (−53.9%) |
| `DOMContentLoaded` (từ lúc bắt đầu điều hướng) | 473 ms | 61 ms | **−412 ms (−87.1%)** |
| `domComplete` | 475 ms | 69 ms | −406 ms (−85.5%) |
| `load` event | 476 ms | 69 ms | −407 ms (−85.5%) |
| **Ước tính thời gian parse + thực thi script đồng bộ** (`domContentLoaded − responseEnd`) | **358 ms** | **8 ms** | **−350 ms (−97.8%)** |

Kết quả trực tiếp của Fix 3.1 (external hoá mascot base64 — bỏ ~2.65MB chặn HTML parser đồng bộ) + Fix 3.2 (bỏ `<script>` SheetJS đồng bộ trong `<head>`) + Fix 3.3 (bỏ `renderHistory()` không điều kiện lúc boot).

*Đo trên Chromium desktop. Trên iPhone thật (CPU yếu hơn, đặc biệt đời cũ) độ chênh tuyệt đối có thể khác, nhưng cải thiện mang tính cấu trúc (ít byte hơn để parse) nên hướng cải thiện là chắc chắn. **Chưa test trên iPhone thật.***

## 4. Render (dựng UI khi thực sự gọi, không phải lúc boot)

| Hành động | BEFORE | AFTER |
|---|---|---|
| `renderHistory()` chạy KHÔNG điều kiện lúc boot? | ✅ Có — 80/80 buổi tập + 6 ô thống kê dựng ngay dù đang ở màn Hôm nay | ❌ Không — `#historyList`/`#historyStatGrid` = 0 phần tử ngay sau boot |
| `renderHistory()` khi mở tab Lịch sử | 80 buổi tập dựng đúng (đã chạy sẵn lúc boot) | 80 buổi tập dựng đúng, mất **~20.1 ms** (trung bình 5 lần đo) đúng lúc mở tab |

→ Với 80 buổi tập, BEFORE trả phí ~20ms ở **mọi** lần mở app kể cả khi không xem tab Lịch sử; AFTER trả phí 0ms lúc boot, chỉ trả ~20ms đúng 1 lần khi user thật sự mở tab đó. Chức năng giữ nguyên 100% (đã verify: đúng 80 buổi + 6 ô thống kê hiện đủ khi mở tab).

## 5. Search / filter (màn Chọn bài, lọc trên 873 bài)

| Chỉ số | BEFORE | AFTER |
|---|---|---|
| `renderPicker()` với từ khoá "press" (873 → 97 kết quả), trung bình 5 lần gọi | 8.74 ms | 8.60 ms |

**Không đổi** (chênh lệch nằm trong nhiễu đo đạc). N13 (thiếu debounce khi gõ tìm kiếm) **cố ý nằm ngoài phạm vi** 5 batch lần này — audit gốc đã ghi nhận "873 bài chưa phải dataset cực lớn... giải pháp đơn giản và ổn định được ưu tiên", và dưới 10ms/lần gõ trên Chromium là đủ mượt, không cấp thiết. Ghi nhận vào mục khuyến nghị còn tồn tại của báo cáo cuối.

## 6. Memory (JS heap — chỉ tham khảo)

| | BEFORE | AFTER |
|---|---|---|
| `usedJSHeapSize` ngay sau boot | 18,241,740 bytes (~17.4 MB) | 17,948,549 bytes (~17.1 MB) |
| `totalJSHeapSize` | 20,563,272 bytes (~19.6 MB) | 19,125,913 bytes (~18.2 MB) |

Nhẹ hơn một chút (không giữ chuỗi base64 mascot 2.65MB trong bộ nhớ lúc boot) nhưng không phải trọng tâm batch nào — chênh lệch nhỏ, mang tính tham khảo. `performance.memory` là API riêng Chromium, Safari không có API tương đương để đối chiếu trực tiếp. **Chưa test trên iPhone thật.**

## 7. Database integrity (873 bài Exercise Database)

| | BEFORE | AFTER |
|---|---|---|
| Số lượng bài | 873 | 873 |
| Checksum nội dung (djb2 trên `JSON.stringify` toàn catalog) | 815734522 | **815734522** |
| Độ dài JSON | 348,977 ký tự | 348,977 ký tự |
| ID đầu / cuối | `3_4_Sit-Up` / `Zottman_Preacher_Curl` | `3_4_Sit-Up` / `Zottman_Preacher_Curl` |

**Checksum khớp tuyệt đối** — xác nhận `window.SOGYM_EXERCISE_CATALOG` (873 bài, đủ field `nameEn`/`nameViAuto`/`sub`/`equipGroup`/`equipDetail`/`force`/`id`) hoàn toàn không bị đụng tới qua cả 5 batch, đúng yêu cầu "không được làm mất database" (Section VIII của prompt gốc).

*Đính chính (Bước 7, 2026-08-24): con số checksum `819009439` ghi ở bản gốc Bước 6 là lỗi chép nhầm khi đo — đo lại độc lập trên cả 2 file (fresh reload, localStorage rỗng, không qua tương tác nào) cho cùng 1 kết quả **815734522** trên cả BEFORE lẫn AFTER, khớp tuyệt đối với nhau (giống hệt count/độ dài JSON/ID đầu-cuối đã ghi). Kết luận "database không hề bị đụng tới" vẫn đúng và không đổi — chỉ riêng 9 chữ số ghi sai được sửa lại cho chính xác.*

---

## Tổng kết Bước 6

- **Nhẹ hơn:** HTML giảm 58.1% dung lượng (4.77MB → 1.91MB).
- **Nhanh hơn:** `DOMContentLoaded` giảm 87.1%; thời gian parse+exec script đồng bộ giảm ~97.8% (358ms → 8ms).
- **Không mất chức năng:** History (render đúng 80/80 buổi khi mở tab), Search (~8.6ms không đổi), Export, SW cache đều verify lại cho kết quả đúng sau khi đổi.
- **Không mất dữ liệu:** checksum Exercise Database khớp tuyệt đối; `localStorage` key/schema không đổi (`sogym_data_v1`, cùng đọc được cho cả 2 bản).
- **Đánh đổi đã biết, có chủ đích:** SW.js lớn hơn +4.3KB (đổi lấy logic LRU đúng đắn + bucket riêng cho splash); thêm 1 file 930KB `xlsx.full.min.js` trên đĩa (đổi lấy Export hoạt động offline — đúng mục tiêu offline-first của audit).
- **Cố ý ngoài phạm vi (có ghi chú lý do trong code/roadmap):** search chưa debounce (N13), C7 (PR khoá theo tên) hoãn sửa + có comment giải thích, N3-b (gộp 3 hàm combo) bỏ qua theo quyết định user.

**Trạng thái:** Bước 6 hoàn tất. Tiếp theo: Bước 7 (test lại toàn bộ chức năng) + soạn `SoGym_Final_Optimization_Report.md` + tạo file deliverable cuối cùng (`SoGym_A_Final_Optimized_v1.html`, `SoGym_A_Final_Optimized_SW_v1.js`).
