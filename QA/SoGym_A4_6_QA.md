# A4.6 — Full Exercise Database QA Report

**File tested:** `SoGym_A4_5_v9.html` (không tạo version mới — A4.6 là bước QA thuần, không sửa code trừ khi phát hiện lỗi cần vá).
**Phạm vi:** ID/tên/nhóm cơ/thiết bị/force/override/tìm kiếm/lọc/thêm vào buổi tập/Lịch sử/offline/hiệu năng, trên toàn bộ 873 bài.

## 1. Data-integrity sweep (Python trên `window.SOGYM_EXERCISE_CATALOG` trích xuất từ file)
| Kiểm tra | Kết quả |
|---|---|
| Tổng số bài | 873 — đúng |
| ID trùng lặp | 0 |
| ID chứa ký tự không an toàn (ngoài chữ/số/`_`/`-`) | 0 |
| Field bắt buộc thiếu (id/nameEn/nameViAuto/sub/equipGroup/equipDetail/primary) | 0 |
| Giá trị `equipGroup` hợp lệ (chỉ trong 4 giá trị Không cần máy / Máy chuyên biệt / Máy cáp / Máy Smith) | **CÓ VẤN ĐỀ** — xem mục 3.1 |
| Số nhóm cơ (`sub`) khác nhau trong catalog gốc | 26 — khớp đúng danh sách hiển thị trong `#subgroupFilter` |
| `nameViAuto` trùng lặp giữa 2 bài khác ID | 0 |
| Field `level`, `form`, `primary` | đầy đủ 873/873 |
| Field `force` | **389/873 rỗng** — xem mục 3.2 |

## 2. Runtime/browser checks (real browser qua Claude Preview MCP, server `sogym-static`)
| Kiểm tra | Kết quả |
|---|---|
| Search reachability: mỗi bài trong 873 bài có thể tìm ra bằng chính tên tiếng Việt/Anh của nó | 873/873 PASS |
| Phân bố chip thiết bị (`resolvedEquipGroup`) | Không cần máy: 725, Máy chuyên biệt: 67, Máy cáp: 81, **Máy Smith: 0** |
| Dropdown nhóm cơ (26 mục) khớp catalog gốc | Đúng (khi đã dọn dữ liệu test cũ khỏi `customExercises`, xem mục 4) |
| Lọc kết hợp chip + nhóm cơ (4 tổ hợp, đối chiếu UI render vs lọc thủ công trên catalog) | Trùng khớp 100% (2, 0, 58, 8 bài) |
| Lọc chip "Máy Smith" + bất kỳ nhóm cơ nào | Luôn 0 kết quả — xác nhận lại lỗi mục 3.1 |
| Thêm vào buổi tập — mẫu 5 bài trải đều các nhóm thiết bị khác nhau | Cả 5 đều thêm đúng vào `sessionExercises`, chuyển đúng sang tab Hôm nay, `pickerSelectedId` reset đúng |
| Hiệu năng render danh sách lớn (725 bài nhóm "Không cần máy") | 21.6ms — rất nhanh, không có vấn đề |
| Service Worker | Active đúng scope, `SW_A4_5_v1.js` |
| Cache offline (`sogym-cache-v2`, `sogym-images-v1`) | Có cache font, thư viện xlsx, ảnh minh họa, app shell — đúng như thiết kế |
| Xuất Excel (`buildExportSheets`) với dữ liệu giả lập gồm cả bài có `force` rỗng | Không lỗi/crash; volume tính đúng (1600kg); tỷ lệ Đẩy:Kéo tính đúng (70/30, tự động bỏ qua bài `force` rỗng) |
| Console errors trong toàn bộ quá trình test | Không có |

## 3. Phát hiện lỗi dữ liệu (2 vấn đề — CHƯA SỬA, chờ quyết định)

### 3.1 Chip lọc "Máy Smith" không hoạt động (0/873 kết quả)
- **Nguyên nhân:** 20 bài có tên tiếng Anh chứa "Smith" (vd `Smith_Machine_Bench_Press`, `Decline_Smith_Press`...) đang bị gán `equipGroup` sai:
  - 19 bài → `"Máy chuyên biệt"`
  - 1 bài (`Smith_Incline_Shoulder_Raise`) → `"Không cần máy"`
  - Đúng ra cả 20 bài này phải là `"Máy Smith"`.
- **Đã kiểm tra chéo:** lỗi này CHỈ xảy ra ở nhóm Máy Smith. Đối chiếu "Cable"→"Máy cáp" và "Machine"→"Máy chuyên biệt" đều 0 sai lệch — 2 nhóm còn lại nhất quán, không phải lỗi hệ thống lan rộng.
- **Nguồn gốc:** lỗi thuộc bước gán nhóm thiết bị đã làm ở A4.1/A4.2 (đã confirm OK trước đây), không phải do các bản vá A4.3–A4.5.
- **Ảnh hưởng thực tế:** chip "Máy Smith" ở màn Chọn bài (1 trong 4 chip đã lên UI) hiện luôn ra "Không tìm thấy bài phù hợp", dù trông như 1 lựa chọn lọc bình thường.

### 3.2 Field `force` (Đẩy/Kéo) rỗng ở 389/873 bài
- Field này được dùng thật trong app: cột "Loại lực" khi xuất Excel, và thống kê "Tỷ lệ Volume Đẩy : Kéo" ở màn Lịch sử.
- Bài có `force` rỗng bị tự động loại khỏi tỷ lệ Đẩy:Kéo (không lỗi/crash, nhưng tỷ lệ hiển thị sẽ thiếu chính xác nếu người dùng tập nhiều bài thuộc nhóm rỗng này).

→ Cả 2 vấn đề đều là lỗi DỮ LIỆU catalog gốc (không phải lỗi code A4.3–A4.5), nên theo đúng tiền lệ đã thống nhất (vụ lỗi search A4.4 vá ở A4.5), **chưa tự sửa** — chờ quyết định của người dùng về hướng xử lý (vd: gán lại `equipGroup` đúng cho 20 bài Máy Smith; bổ sung `force` cho 389 bài rỗng, hoặc chấp nhận giữ nguyên).

## 4. Ghi chú dọn dẹp môi trường test
- Phát hiện 1 bài test cũ (`custom_1787208741761_776` — "Máy test thật") còn sót trong `localStorage.customExercises` của server preview dùng chung, khiến lúc đầu đếm ra 874 bài và dropdown nhóm cơ dư 1 mục "Chưa phân loại". Đã `localStorage.clear()` + reload trước khi chạy các bước kiểm tra ở mục 2 — không phải lỗi app, chỉ là rác dữ liệu test.
- Đã dọn lại `localStorage` (session test 5 bài thêm ở bước "Thêm vào buổi tập") sau khi test xong.

## Status
Đã chạy test thật đầy đủ trên toàn bộ 873 bài (data-level + browser-level), không phát hiện lỗi CODE nào (0 console error, mọi luồng UI/lọc/thêm bài/xuất báo cáo/offline đều đúng). Phát hiện 2 lỗi DỮ LIỆU catalog gốc (mục 3.1, 3.2) — **chờ người dùng quyết định hướng xử lý** trước khi coi A4.6 là hoàn tất.
