# SoGym_A6_v1 — QA Report

**File:** `SoGym_A6_v1.html` (copied từ `SoGym_A5_v3.html`, đã được user xác nhận "A5_v3 OK" trước khi copy).
**Bước roadmap:** A6 — Data Management (🎯 flagged, bắt buộc mô phỏng thất bại 3-5 tình huống).

## Scope đã xác nhận với user (qua AskUserQuestion trước khi code)
User chọn cả 4 mục cho A6:
1. Reset toàn bộ dữ liệu
2. Backup/Export dữ liệu ra file
3. Restore/Import dữ liệu từ file
4. Integrity checks (kiểm tra & tự sửa dữ liệu lỗi)

**Phát hiện quan trọng trước khi code:** mục 2 và 3 (Backup/Export, Restore/Import) **đã tồn tại sẵn** trong codebase từ trước (`backupJson()`, listener `#restoreFile`) nhưng **chưa từng được QA chính thức**. Đã báo lại cho user, tránh xây lại trùng — A6_v1 chỉ code MỚI 2 mục (1) và (4), còn (2)/(3) chuyển sang diện QA lại từ đầu.

**Thiết kế đã chốt qua AskUserQuestion (2 câu hỏi):**
- Nút "🗑 Xóa toàn bộ dữ liệu": đặt cạnh nút Sao lưu trong tab Lịch sử, xác nhận 2 lớp (`confirm()` cảnh báo hậu quả + nhắc ngày sao lưu gần nhất, sau đó `prompt()` bắt gõ đúng chữ "XÓA").
- Integrity check: tự động rà soát mỗi lần mở tab Lịch sử (không cần nút bấm riêng) + tự sửa an toàn, không đụng số liệu reps/kg thật.

## Lỗi nghiêm trọng phát sinh trong lúc code (tự phát hiện, đã tự sửa trước khi test)
Khi viết hàm `resetAllData()` bằng script Python (heredoc) để chèn chuỗi cảnh báo nhiều dòng, chuỗi `\n\n` (dự định tạo escape-sequence `\n` bên trong JS string 1 dấu-nháy) bị pipeline mangling thành **ký tự xuống dòng thật (raw newline)** nằm ngay trong JS string 1-dấu-nháy — JS string thường (không phải template literal) không được phép chứa raw newline chưa escape, nên đây là lỗi cú pháp `unterminated string literal`. Hậu quả: **toàn bộ khối `<script>` thứ 3 (chứa gần hết logic app) không parse được**, khiến `state`, `switchScreen`, mọi hàm chính đều `undefined`, splash screen không bao giờ ẩn — app hoàn toàn không chạy được.

**Chẩn đoán:** console log không hiện lỗi nào (gây hiểu nhầm) — phải dùng `typeof state`/`typeof switchScreen` v.v. trong browser để xác định khối script nào hỏng, sau đó đọc trực tiếp file bằng `Read` tool ở đúng vùng nghi vấn để thấy ký tự xuống dòng thật nằm sai chỗ.

**Fix:** thay chuỗi 1-dấu-nháy bằng **template literal** (dấu backtick) — hỗ trợ raw newline tự nhiên, không cần escape, tránh hẳn lớp lỗi pipeline-mangling này về sau. Đã verify lại bằng `Read` tool: cú pháp đúng, không còn raw-newline-trong-string-thường.

Sau khi sửa, verify lại qua browser thật: `typeof state/switchScreen/resetAllData/runIntegrityCheck` đều là kiểu đúng, `catalog` OK, splash ẩn đúng (`hide` class có mặt), 0 console error.

## Ghi chú kỹ thuật — vùng chồng lấn giữa `runIntegrityCheck()` và cơ chế chuẩn hóa sẵn có
Phát hiện trong lúc test: `loadState()` đã gọi `normalizeDataModelV3()` mỗi lần load trang, tự sửa `ex.sets` không phải mảng và `workout.exercises` không phải mảng — nghĩa là 2/5 loại lỗi mà `runIntegrityCheck()` xử lý **đã được lớp load-time xử lý từ trước** (an toàn, không xung đột, chỉ là 2 lớp phòng thủ trùng nhau — đúng tinh thần "cùng tinh thần với migrateData()" đã ghi trong comment code). Tuy nhiên `runIntegrityCheck()` có giá trị THỰC SỰ MỚI ở 3 điểm mà lớp load-time KHÔNG xử lý:
- `customOverrides` trỏ tới exercise id không tồn tại (orphan reference) — chưa từng được dọn ở đâu khác.
- `customExercises` thiếu id hoặc trùng id — chưa từng được dọn ở đâu khác.
- **History session là `null`/không phải object** — `normalizeWorkoutModel(null)` chỉ no-op (không xóa phần tử `null` khỏi mảng), nên nếu không có `runIntegrityCheck()`, 1 session `null` trong `history` sẽ tồn tại vĩnh viễn và có thể gây crash khi render (`sess.dateISO` trên `null`).

Đã test đầy đủ 5 loại lỗi injected cùng lúc (xem bảng test bên dưới) — verify đúng count, đúng nội dung sửa, đúng thông báo, và đúng tính idempotent (mở lại tab Lịch sử lần 2 → 0 lỗi thêm).

## Real-browser tests (Claude Preview MCP, server `sogym-static`, cổng 8934)

### Baseline sau khi sửa lỗi cú pháp
| Test | Kết quả |
|---|---|
| `localStorage.clear()` + reload | `typeof state/switchScreen/resetAllData/runIntegrityCheck` đều đúng kiểu, `splashScreen.hide`=true |
| Console errors | Không có, trong suốt toàn bộ quá trình test bên dưới |

### Backup/Export (`backupJson()` — có sẵn, QA lần đầu)
| Test | Kết quả |
|---|---|
| Seed dữ liệu thật (history, customExercises, customOverrides, body) → export | Payload có đủ `_sogym_backup=true`, `_schemaVersion=3`, đủ toàn bộ field, `lastBackupISO` được cập nhật đúng ngày hiện tại sau khi export |

### Restore/Import (`#restoreFile` listener — có sẵn, QA lần đầu)
| Test | Kết quả |
|---|---|
| File backup hợp lệ (đúng schema hiện tại) → confirm() | Toàn bộ state (history, customOverrides, customExercises, body, lastBackupISO) được thay thế đúng, alert "Khôi phục thành công.", input file tự clear |
| File JSON hợp lệ nhưng KHÔNG có marker `_sogym_backup` | Bị từ chối đúng ("File này không phải file sao lưu hợp lệ..."), dữ liệu hiện tại KHÔNG bị đổi |
| File JSON bị lỗi cú pháp (corrupt) | Bị từ chối đúng ("File sao lưu bị lỗi, không đọc được..." kèm message lỗi JSON thật), dữ liệu hiện tại KHÔNG bị đổi |
| File backup kiểu cũ (schema v1 — thiếu `_schemaVersion`, thiếu `body`/`nutrition`/`goals`) | `migrateData()` tự nâng cấp đúng: các field thiếu được khởi tạo đúng kiểu mảng/object, restore thành công, "Khôi phục thành công." |

### Reset toàn bộ dữ liệu (`resetAllData()` — MỚI, 🎯 mô phỏng thất bại)
| Kịch bản | Kết quả |
|---|---|
| Hủy ở `confirm()` đầu tiên | `prompt()` KHÔNG được gọi, dữ liệu trong localStorage nguyên vẹn |
| Đồng ý `confirm()`, hủy `prompt()` (bấm Cancel → `null`) | Dữ liệu nguyên vẹn |
| Đồng ý `confirm()`, gõ sai chữ (chữ thường "xóa") | Alert "Xác nhận không đúng — đã hủy thao tác...", dữ liệu nguyên vẹn |
| Đồng ý `confirm()`, gõ chuỗi rỗng | Cùng alert từ chối, dữ liệu nguyên vẹn |
| Đồng ý `confirm()`, gõ đúng "XÓA" (có khoảng trắng thừa 2 đầu, test `.trim()`) | `localStorage.removeItem` thành công |
| **Luồng thật đầy đủ** (không mock `location.reload`): seed dữ liệu thật → `confirm()`=true → gõ đúng "XÓA" → để `location.reload()` chạy thật | Sau reload: `localStorage.getItem(STORAGE_KEY)`=null, `state.history.length`=0, splash ẩn đúng, app khởi động lại y hệt lần đầu mở — verify bằng browser thật, không mock |

### Integrity check (`runIntegrityCheck()` — MỚI, tự động khi mở tab Lịch sử)
| Test | Kết quả |
|---|---|
| Inject cùng lúc 5 lỗi: `customOverrides` orphan ref, `customExercises` trùng id, `customExercises` thiếu id, 1 session `null` trong `history`, 1 exercise có `sets` không phải mảng | Mở tab Lịch sử (`switchScreen('history')`) → cả 5 lỗi được sửa đúng: override orphan bị xóa (override hợp lệ vẫn giữ), 2 bản `customExercises` lỗi bị loại (giữ đúng 2 bản hợp lệ), session `null` bị loại khỏi `history`, `sets` không hợp lệ được ép về mảng rỗng. Notice hiện đúng: "Đã tự động dọn 5 mục dữ liệu lỗi..." |
| Mở lại tab Lịch sử lần 2 (idempotency) | 0 lỗi phát hiện thêm, notice ẩn (`display:none`), dữ liệu đã sửa ở lần 1 giữ nguyên không đổi thêm |

### Regression — các tính năng liên quan trước đó (đảm bảo A6_v1 không phá vỡ gì)
| Test | Kết quả |
|---|---|
| A5_v3 — picker: gõ tìm kiếm + đổi chip + đổi bộ lọc nhóm cơ → chuyển tab → quay lại | Cả 3 (search/chip/subgroup) đều reset đúng |
| A5_v1 — set trong buổi đang tập: thêm 2 set → sửa set #1 (reps/kg) → xóa set #1 | Thêm đúng 2 set, sửa đúng giá trị mới + tính lại `rm`, xóa đúng phần tử, mảng còn lại đúng |
| Kết thúc buổi → lưu vào Lịch sử | `state.history` tăng đúng 1 phần tử, đúng số bài tập, `sessionStarted` về `false` |
| v6 — chip "★ Yêu thích" (chưa có bài yêu thích) | Chip active đúng, hiện đúng thông báo "Chưa có bài yêu thích nào..." |
| v7 — form "+ Bài tập khác": mở form, gõ dở, chuyển tab, quay lại | Form tự đóng (`display:none`), đúng như thiết kế |
| v9 — form "+ Thêm Cardio": mở form, gõ dở loại hình, chuyển tab (Lịch sử) rồi quay lại (Hôm nay) | Form tự đóng, field tự xóa trắng |
| Console errors trong TOÀN BỘ quá trình test (kể cả lúc phát hiện+sửa lỗi cú pháp nghiêm trọng ở trên) | Không có |
| Baseline cuối cùng: `localStorage.clear()` + reload | Splash ẩn đúng, màn Hôm nay active, 0 console error |

## Status
Đã xác nhận scope + thiết kế với user trước khi code (đúng quy tắc). Phát hiện Backup/Restore đã có sẵn, tránh code trùng. Tự phát hiện và tự sửa 1 lỗi nghiêm trọng (JS syntax error làm sập toàn bộ app) trước khi giao. Test thật đầy đủ: Backup/Restore (QA lần đầu), Reset-all-data (đủ 🎯 5 kịch bản thất bại + 1 luồng thành công thật), Integrity-check (5 loại lỗi injected + idempotency), hồi quy toàn diện các tính năng A4.5–A5_v3. PASS toàn bộ, 0 console error trong suốt quá trình. Chờ user xác nhận **"A6_v1 OK"**.
