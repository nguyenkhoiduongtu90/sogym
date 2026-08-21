# BÁO CÁO QA — Sổ Gym A4.3_v2

**File sửa:** `SoGym_A4_3_v2.html` (dựa trên `SoGym_A4_3_v1.html`, không ghi đè)
**Baseline:** `SoGym_A4_2_v2_Mapping_Simulated.xlsx` (sheet `Mapping_873`)
**Phương pháp test:** Chạy THẬT trong trình duyệt (Chromium qua Claude Preview, static server bằng `python -m http.server`), không phải jsdom — click DOM thật, gõ input thật, gọi hàm thật, reload thật để kiểm tra localStorage. Đối chiếu lại dữ liệu catalog với Excel bằng Python/openpyxl.

---

## 1. VẤN ĐỀ (từ QA A4.3_v1)

**FINDING-001 (HIGH):** `allExercises()` đọc từ `CATALOG` (11 bài mẫu cũ) thay vì `window.SOGYM_EXERCISE_CATALOG` (873 bài thật) → picker/search/override chỉ hoạt động trên 11 bài, dữ liệu 873 bài là "dữ liệu chết".

**FINDING-002 (LOW):** Metadata `<title>` và comment version trong file ghi sai (A3/A2_v1) so với thực tế.

---

## 2. PHƯƠNG ÁN ĐÃ LÀM

1. Gỡ bỏ hoàn toàn biến `CATALOG` (11 bài mẫu) — đã xác nhận cả 11 ID mẫu đều tồn tại trong 873 bài thật nên không mất khả năng truy xuất bài nào.
2. `allExercises()` đổi sang đọc `window.SOGYM_EXERCISE_CATALOG` (873) + `state.customExercises`.
3. Catalog 873 dùng `equipGroup`/`equipDetail` (khác với field `equip` đơn của 11 bài mẫu cũ và của `customExercises` hiện có). Thêm 3 hàm mới: `resolvedEquipGroup()`, `resolvedEquipDetail()`, `resolvedEquipmentDisplay()` — có fallback sang `ex.equip` để **không phá dữ liệu `customExercises` đã lưu trước đó**, và tôn trọng `customOverrides` theo đúng kiến trúc override đã thống nhất (mục 10). Định dạng hiển thị dùng đúng dấu `" — "` (mục 9).
4. `renderPicker()`: sửa bộ lọc thiết bị dùng `resolvedEquipGroup()` thay vì `ex.equip` (field không tồn tại trên catalog mới). Sửa dòng hiển thị thiết bị dùng `resolvedEquipmentDisplay()`.
5. **Hiệu năng (mục 19):** Theo lựa chọn anh đã chọn — khi màn Chọn bài mở mà chưa gõ tìm kiếm và chưa chọn bộ lọc thiết bị ("Tất cả"), KHÔNG render 873 bài, chỉ hiện thông báo hướng dẫn tìm/lọc. Danh sách chỉ render khi có từ khóa hoặc đã chọn 1 nhóm thiết bị cụ thể.
6. Thêm chip lọc "Máy Smith" (theo lựa chọn anh đã chọn, cho đủ 4 nhóm equipGroup chuẩn — hiện 0/873 bài thuộc nhóm này nên bấm vào sẽ ra "Không tìm thấy bài phù hợp", đúng thực tế dữ liệu).
7. Sửa `<title>` và comment version (FINDING-002) → `A4.3_v2`, Schema 3, có ghi chú nguồn catalog.
8. **KHÔNG làm:** không thêm UI sửa equipGroup/equipDetail (để dành bước sau, theo quyết định anh đã chọn); không đụng SW.js; không đụng cơ chế cache CDN SheetJS (FINDING-003, vẫn ghi nhận, chưa xử lý).

---

## 3. KẾT QUẢ TEST (chạy thật trong browser, có số liệu cụ thể)

### Database & Runtime
| Test | Kết quả |
|---|---|
| `SOGYM_EXERCISE_CATALOG.length` | 873 |
| `CATALOG` (biến cũ) còn tồn tại? | Không (`typeof CATALOG === 'undefined'`) |
| `allExercises().length` (state rỗng) | **873** (trước đây là 11) |
| Unique ID trong `allExercises()` | 873/873, 0 trùng |
| `catalogById()` bài đầu / bài cuối / bài giữa (`Barbell_Squat`) | Tìm thấy cả 3 |
| Đối chiếu lại catalog 873 trong file v2 với Excel baseline | missing=0, extra=0, mismatch=0 (trừ 225 `nameViAuto` fallback tiếng Anh — đúng như FINDING-004, không đổi) |
| Console lỗi khi tải trang | 0 |
| Console warning | 0 |

### Override (6/6 tiêu chí mục X, test cả field thiết bị mới)
| Test | Kết quả |
|---|---|
| `saveOverride()` cho `nameVi`, `subgroup`, `equipGroup`, `equipDetail` trên bài thuộc 873 (`Barbell_Squat`) | Lưu đúng, `resolvedName`/`resolvedSub`/`resolvedEquipmentDisplay` đều trả về giá trị override |
| Catalog gốc (`window.SOGYM_EXERCISE_CATALOG`) có bị mutate? | Không |
| Bài khác (`Cable_Crossover`) có bị ảnh hưởng? | Không |
| Override lưu đúng theo `catalogId` trong `localStorage.customOverrides`? | Có, đúng key |
| Reload trang — override còn? | Còn nguyên (đã test bằng `location.reload()` thật) |
| Xoá override — trả về dữ liệu gốc? | Có |
| Sửa qua UI thật (gõ vào ô Tên, blur) | Hoạt động, `saveOverride` được gọi đúng |

### Equipment display
| Bài | Kết quả `resolvedEquipmentDisplay()` |
|---|---|
| `Barbell_Squat` | `Không cần máy — Tạ đòn` |
| `Cable_Crossover` | `Máy cáp — Máy cáp (Cable)` |
| `Ab_Roller` (equipDetail gốc = "Chưa xác định") | `Không cần máy — Chưa xác định` |
| Override `equipGroup="Máy Smith"`, `equipDetail="..."` | `Máy Smith — ...` (đúng dấu `" — "`) |
| Bài tự thêm (`customExercises`, chỉ có field `equip`) | Hiển thị đúng nhóm, không bịa `equipDetail` (VD: `Máy chuyên biệt`) |

### Picker UI thật (click/gõ thật trên DOM, không phải suy đoán)
| Test | Kết quả |
|---|---|
| Mở màn Chọn bài, chưa gõ/lọc | Chỉ 1 DOM node (thông báo hướng dẫn) — **không render 873 item** |
| Gõ "squat" | 56 kết quả, đúng dữ liệu (VD `Barbell_Full_Squat`) |
| Bấm chip "Máy cáp" | **81 kết quả** — khớp chính xác số liệu baseline (81 bài Máy cáp trong 873) |
| Bấm chip "Máy Smith" | 0 kết quả, hiện "Không tìm thấy bài phù hợp" — khớp thực tế 0/873 bài thuộc nhóm này |
| Reset về "Tất cả" + xoá tìm kiếm | Quay lại trạng thái ẩn danh sách |
| Click chọn 1 bài ngoài 11 bài mẫu cũ (`Barbell_Full_Squat`) | Hiện đúng detail card, đúng tên/nhóm cơ |
| Bấm "Thêm vào buổi tập" | `state.sessionExercises` tăng đúng, chuyển màn về Home |

### Custom Exercise
| Test | Kết quả |
|---|---|
| Thêm bài custom | `allExercises()` = 874 (873 + 1) |
| ID không trùng với 873 bài | Đúng |
| Reload — custom exercise còn? | Còn |

### History / localStorage
| Test | Kết quả |
|---|---|
| Bắt đầu buổi tập → thêm bài (từ 873) → thêm set → kết thúc buổi → lưu | `state.history.length` = 1, đúng dữ liệu |
| Reload trang | History còn nguyên, `customExercises` còn, `customOverrides` còn |
| `localStorage.clear()` trong code | 0 lần gọi |
| `localStorage.setItem` trực tiếp ngoài `SoGymDataStore` | 0 lần (đúng như v1) |

---

## 4. LỖI CÒN TỒN TẠI / GHI NHẬN (không tự ý xử lý)

- **FINDING-003 (chưa xử lý, đúng như đã thống nhất):** `xlsx.full.min.js` vẫn tải từ CDN `cdn.sheetjs.com`, `SW.js` chưa pre-cache. Vẫn là WARNING/LOW, để dành bước phù hợp sau.
- **Chưa có UI sửa equipGroup/equipDetail** (theo quyết định của anh) — cơ chế override đã hoạt động đúng ở tầng hàm, nhưng người dùng chưa tự bấm sửa thiết bị được trên giao diện. Đây là việc của bước sau (VD A4.4), không phải lỗi của A4.3_v2.
- **NOT TESTABLE:** iPhone/Safari thật, thao tác chạm thật trên thiết bị thật, hiệu năng thật trên máy yếu/mạng chậm. Môi trường test là Chromium thật (không phải jsdom) nên độ tin cậy cao hơn A4.3_v1, nhưng vẫn không thay thế được test trên Safari/iPhone thật.
- Một số bài trong 11 ID mẫu cũ (VD `Cable_Crossover`) giờ hiển thị tên/nhóm cơ **khác với text mẫu cũ đã gõ tay trước đây**, vì giờ đọc đúng từ baseline Excel thật (mẫu cũ là dữ liệu giả lập tay, không phải baseline) — đây là thay đổi **có chủ đích và đúng**, không phải lỗi.

---

## 5. FILE KẾT QUẢ

- `SoGym_A4_3_v2.html` — file chính, đã sửa và test.
- `SoGym_A4_3_v2_QA.md` — báo cáo này.
- `SW.js` — **không đổi**, không cần cấp lại.
- `SoGym_A4_2_v2_Mapping_Simulated.xlsx` — baseline, không đổi.

**Trạng thái:** Đã sửa FINDING-001 và FINDING-002. Test runtime + UI + localStorage + database đều PASS. Chờ anh xác nhận **"A4.3_v2 OK"** trước khi sang bước kế tiếp.
