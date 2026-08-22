# QA — SoGym_A7_v6.html — Fix tiếp lỗi "Xóa toàn bộ dữ liệu" vẫn báo sai (tái diễn sau A7_v5)

**Ngày:** 2026-08-22
**File:** `SoGym_A7_v6.html` (copy từ `SoGym_A7_v5.html`, chỉ sửa đúng 1 hàm `resetAllData()` + đổi `<title>` + thêm 2 khối comment changelog)
**SW:** không đổi, vẫn `SW_A7_v2.js` (bug này nằm hoàn toàn ở tầng JS ứng dụng, không liên quan Service Worker)
**Trạng thái:** Đã fix + test thật kỹ, PENDING xin phép push GitHub.

## Báo cáo của user (nguyên văn, qua URL live)
> "https://nguyenkhoiduongtu90.github.io/sogym/SoGym_A7_v5.html — vẫn lặp lại lỗi cũ, không xóa được, cần kiểm tra lại , sửa thật sự trước khi báo cáo đã xong"

Tức: sau khi A7_v5 đã push (fix NFC/NFD) và báo cáo "đã xong", user test lại trên URL live thật và vẫn gặp ĐÚNG lỗi cũ (gõ XÓA vẫn bị báo "Xác nhận không đúng").

## Bước 1 — Loại trừ nguyên nhân "chưa deploy đúng bản đã fix"
Trước khi nghi ngờ code sai, kiểm tra khả năng cache/deploy trước:
- Tải trực tiếp `https://nguyenkhoiduongtu90.github.io/sogym/SoGym_A7_v5.html` bằng `curl`, so **byte-để-byte** (sau khi chuẩn hoá line-ending) với file `SoGym_A7_v5.html` trong repo local.
- Kết quả: **MD5 khớp 100%** (`d22085e3c0d09304ebbce7c1a566fd5e`). Bản đang chạy live đúng là bản đã có fix NFC/NFD của A7_v5, không phải bản cũ hơn, không phải lỗi cache/deploy.
- Kết luận: phải có **nguyên nhân thứ hai**, riêng biệt với NFC/NFD, gây ra cùng 1 triệu chứng (alert "Xác nhận không đúng").

## Bước 2 — Tìm nguyên nhân thứ hai bằng test thật (không suy đoán suông)
Dùng Python (`unicodedata.normalize`, cùng chuẩn Unicode NFC với JS `.normalize('NFC')`) mô phỏng lại chính xác logic so sánh cũ (`typed.trim().normalize('NFC') !== 'XÓA'.normalize('NFC')`) với các chuỗi mà bàn phím điện thoại THỰC TẾ có thể sinh ra khi user "gõ chữ XÓA":

| Trường hợp gõ | Bị từ chối? |
|---|---|
| `XÓA` (NFC, đúng hoàn toàn) | Không |
| `XÓA` (NFD, iOS decomposed) | Không (đã fix ở A7_v5) |
| `Xóa` (chỉ viết hoa chữ đầu — hành vi auto-capitalize mặc định của hầu hết bàn phím ảo) | **CÓ — bị từ chối** |
| `xóa` (viết thường toàn bộ) | **CÓ — bị từ chối** |
| Có khoảng trắng cuối | Không |
| Có ký tự zero-width space ở đầu (do bàn phím gợi ý từ chèn thêm) | **CÓ — bị từ chối** |

**Nguyên nhân xác nhận:** so sánh cũ **PHÂN BIỆT HOA/THƯỜNG**. Trong khi đó, hành vi mặc định phổ biến của bàn phím ảo di động (iOS lẫn Android) là **auto-capitalize kiểu "sentence case"** — chỉ tự viết hoa CHỮ CÁI ĐẦU của field, không tự viết hoa toàn bộ. User gõ bình thường (không cố ý bật Caps cho từng chữ) sẽ ra `Xóa`, không phải `XÓA` như hướng dẫn cũ yêu cầu — nhưng code cũ vẫn coi đây là "gõ sai" và từ chối, dù về mặt trải nghiệm user tin rằng mình đã làm đúng theo hướng dẫn. Đây là 1 lỗi UX/logic thật, độc lập với lỗi NFC/NFD đã fix trước đó — giải thích chính xác vì sao "lỗi lặp lại y hệt" dù bản fix cũ đã đúng deploy.

## Fix áp dụng trong SoGym_A7_v6.html
Trong `resetAllData()`:
1. Thêm hàm `normalizeConfirmText(s)`: bỏ ký tự vô hình (`​` zero-width space, `‌` ZWNJ, `‍` ZWJ, `\u FEFF` BOM) → `trim()` → `.normalize('NFC')` → `.toUpperCase()`.
2. So sánh `normalizeConfirmText(typed) !== normalizeConfirmText('XÓA')` thay vì so sánh strict cũ — **không phân biệt hoa/thường nữa**, nhưng **vẫn giữ nguyên yêu cầu phải gõ đúng chữ "XÓA" có dấu đúng chính tả** (gõ `XOA` không dấu hoặc từ khác vẫn bị từ chối như cũ — không nới lỏng mức bảo vệ chống xóa nhầm).
3. Đổi câu nhắc `prompt()` từ "gõ chính xác chữ XÓA (viết hoa)" → "gõ chữ XÓA rồi bấm OK (không phân biệt chữ hoa/thường)" để khớp hành vi mới, tránh gây hiểu lầm ngược lại.

Không đổi gì khác trong file (không đổi SW, không đổi hàm nào khác).

## Test lại (real, gọi trực tiếp hàm `resetAllData()` thật trong `SoGym_A7_v6.html` qua Claude Preview — không phải viết lại logic bằng tay)

**Test 1 — 11 trường hợp gõ, mock `confirm()=true` + `prompt()` trả từng chuỗi + spy `localStorage.removeItem`:**
| Trường hợp | Kỳ vọng | Kết quả thật |
|---|---|---|
| `XÓA` (NFC) | Chấp nhận | PASS — `removeCalled`, không alert |
| `XÓA` (NFD) | Chấp nhận | PASS |
| `Xóa` (NFC, chỉ hoa chữ đầu) | Chấp nhận (fix chính) | PASS |
| `Xóa` (NFD, chỉ hoa chữ đầu) | Chấp nhận | PASS |
| `xóa` (NFC, thường toàn bộ) | Chấp nhận | PASS |
| `xóa` (NFD, thường toàn bộ) | Chấp nhận | PASS |
| `XÓA ` (có khoảng trắng cuối) | Chấp nhận | PASS |
| zero-width space + `XÓA` | Chấp nhận (fix phụ) | PASS |
| `XOA` (không dấu) | **Từ chối** (không nới lỏng) | PASS — đúng bị từ chối |
| `DELETE` (từ khác hẳn) | **Từ chối** | PASS |
| chuỗi rỗng | **Từ chối** | PASS |

8/8 biến thể hợp lệ được chấp nhận, 3/3 biến thể sai vẫn bị từ chối đúng như thiết kế — không có false positive/negative.

**Test 2 — hồi quy 2 luồng huỷ (không được đổi hành vi):**
| Trường hợp | Kỳ vọng | Kết quả thật |
|---|---|---|
| User bấm Huỷ ở `confirm()` cảnh báo đầu tiên | Dừng ngay, `prompt()` KHÔNG được gọi, không alert, không xoá | PASS |
| User bấm Huỷ ở `prompt()` (typed = null) | Dừng, không alert, không xoá | PASS |

**Test 3 — console:** 0 lỗi console trong suốt phiên test.

## Giới hạn đã biết
Không test được hành vi auto-capitalize thật của bàn phím iOS/Android (cần thiết bị thật) — đã dùng cách gián tiếp đáng tin cậy hơn: mô phỏng CHÍNH XÁC chuỗi ký tự mà hành vi đó tạo ra (`Xóa` thay vì `XÓA`) rồi test thẳng vào hàm thật, thay vì test suông qua đọc code. Cách này xác nhận được lỗi VÀ xác nhận được fix, chỉ chưa xác nhận được bằng thao tác gõ tay thật trên máy — cần user tự gõ lại 1 lần trên điện thoại thật để chốt.

## Việc KHÔNG làm
Không nới lỏng yêu cầu phải gõ đúng chữ có dấu "XÓA" (chỉ bỏ yêu cầu viết hoa toàn bộ). Không đổi SW. Không đổi hàm nào khác ngoài `resetAllData()`.

## ⚠️ Cần user xác nhận lại trên thiết bị thật (sau khi push GitHub Pages)
1. Vào tab Lịch sử, bấm "🗑 Xóa toàn bộ dữ liệu" → xác nhận cảnh báo → ở hộp thoại gõ chữ, gõ bình thường như thói quen hàng ngày (không cố tình bật Caps) → xác nhận xoá thành công (KHÔNG còn bị báo "Xác nhận không đúng" nữa).
2. Thử gõ sai (ví dụ chỉ gõ "xoa" không dấu, hoặc gõ nhầm chữ khác) → phải vẫn bị từ chối đúng như trước (không bị nới lỏng quá đà).
