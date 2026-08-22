# 🗺️ SỔ GYM — Roadmap Tổng Quan (cập nhật: 2026-08-22)

> **File này là bản TỔNG QUAN duy nhất, luôn được ghi đè trực tiếp mỗi khi có cập nhật** — không tạo file đánh số mới. Muốn xem chi tiết kỹ thuật đầy đủ từng version/bug/fix, xem các file `QA/SoGym_[step]_QA.md` riêng từng bước.

---

## 📍 Đang ở đâu ngay bây giờ

```
Bước hiện tại:   A9 — Modal tự thiết kế thay cho alert()/confirm()/prompt() gốc trình duyệt
Trạng thái:      🟡 Đã code xong + test thật kỹ (Claude Preview MCP, DOM thật), CHỜ BẠN
                 TEST TRÊN IPHONE THẬT rồi xác nhận + cho phép push
File đang chờ:   SoGym_A9_v1.html  (copy từ SoGym_A8_v4.html, không sửa file gốc)

Ngoài ra, A8 (Dinh dưỡng / Chỉ số cơ thể) cũng đang ở trạng thái tương tự — v4 đã
push lên GitHub (đang live), bạn đang test thật trên iPhone, CHƯA xác nhận "OK".
A9 được tách thành 1 bước riêng (không gộp vào A8) vì đây là hạ tầng UI ảnh hưởng
TOÀN BỘ app (~38 chỗ), không phải lỗi riêng của tính năng A8.

Việc bạn cần làm: Test cả A8_v4 (đang live) lẫn A9_v1 (chưa push) trên iPhone thật,
                 xác nhận từng bước, rồi cho phép push A9_v1 lên GitHub.
```

---

## 📊 Tiến độ tổng thể

**Giai đoạn A (Core app):** 8/10 bước xong · 2 bước đang chờ xác nhận (A8, A9)
`[████████████████░░░░] ~80%`

**Giai đoạn B (AI):** 0/6 bước — chưa bắt đầu (chỉ bắt đầu sau khi Giai đoạn A xong hoàn toàn)
`[░░░░░░░░░░░░░░░░░░░░] 0%`

**Tổng cộng toàn dự án:** 8/16 bước lớn đã xong ✅ · 2 bước chờ xác nhận 🟡 · 6 bước chưa bắt đầu ⚪
`[██████████░░░░░░░░░░] ~50%`

**Còn lại để xong Giai đoạn A (app dùng được hoàn chỉnh, chưa có AI):** xác nhận xong A8 + A9 → hết Giai đoạn A

---

## ✅ GIAI ĐOẠN A — Core app (offline, 1 người dùng, không cần server)

| # | Bước | Trạng thái | Ghi chú ngắn |
|---|------|:---:|---|
| A0 | Kiến trúc & phạm vi | ✅ Xong | iPhone/Safari/PWA, offline-first, localStorage |
| A1 | Data Layer | ✅ Xong | Tầng lưu trữ tách biệt dữ liệu/UI |
| A2 | Data Schema | ✅ Xong | Cấu trúc chuẩn Workout/Exercise/Set/History |
| A3 | Workout/Exercise/Set | ✅ Xong | ID chuẩn, không được phá vỡ ở các bước sau |
| A4 | Cơ sở dữ liệu 873 bài tập | ✅ Xong | Audit + mapping + tích hợp UI + hình ảnh + QA toàn bộ (A4.1→A4.6) |
| A5 | Trải nghiệm tập luyện / Lịch sử | ✅ Xong | Chọn bài, nhập set, sửa/xóa set, Lịch sử, thống kê Đẩy/Kéo |
| A6 | Quản lý dữ liệu | ✅ Xong | Xóa toàn bộ dữ liệu + Rà soát tự sửa lỗi dữ liệu + Sao lưu/Khôi phục (JSON) |
| A7 | Google Sheets / Sao lưu online | ✅ Xong | Liên kết Google, sao lưu/khôi phục thủ công lên Sheets (qua 3 vòng sửa lỗi gõ "XÓA" tiếng Việt) |
| **A8** | **Dinh dưỡng / Chỉ số cơ thể** | 🟡 **v4 đã push (live), chờ bạn test thật + xác nhận "OK"** | Cân nặng/%mỡ/%cơ/calo theo ngày, mục tiêu, biểu đồ xu hướng. v4: đồng bộ ngưỡng Mục tiêu với ngưỡng nhập chỉ số, gọn bớt chữ diễn giải |
| **A9** | **Modal tự thiết kế (thay alert/confirm/prompt gốc)** | 🟡 **v1 đã code+test xong, CHƯA push, chờ bạn test thật + xác nhận** | Thay ~38 hộp thoại trắng của trình duyệt bằng modal tự vẽ đúng phong cách app (nền tối, tái dùng màu sẵn có). Bước mới, tách riêng khỏi A8 vì ảnh hưởng toàn app |

---

## 🤖 GIAI ĐOẠN B — AI (chỉ bắt đầu sau khi Giai đoạn A xong hết)

| # | Bước | Trạng thái | Ghi chú ngắn |
|---|------|:---:|---|
| B1 | Chuẩn bị dữ liệu cho AI | ⚪ Chưa bắt đầu | Xuất dữ liệu sạch để AI đọc |
| B2 | Bộ máy phân tích AI | ⚪ Chưa bắt đầu | Phân tích tiến độ, volume, tần suất, PR, điểm yếu |
| B3 | Tích hợp Claude | ⚪ Chưa bắt đầu | Dùng Claude Pro nếu phù hợp |
| B4 | Tích hợp ChatGPT | ⚪ Chưa bắt đầu | Dùng ChatGPT Go nếu phù hợp |
| B5 | So sánh Claude vs ChatGPT | ⚪ Chưa bắt đầu | So sánh chất lượng, không định kiến trước |
| B6 | Cá nhân hóa AI | ⚪ Chưa bắt đầu | AI học cách đặt tên/phân loại/mục tiêu riêng của bạn |

---

## 🔜 Sau khi A8 và A9 được xác nhận "OK", các bước tiếp theo sẽ là

1. → Hoàn tất Giai đoạn A → bắt đầu Giai đoạn B (AI), bắt đầu từ B1

---

## 📌 Quy tắc đang áp dụng (nhắc nhanh)

- Đi tuần tự từng bước, không nhảy cóc. Mỗi bước chỉ qua bước kế khi bạn xác nhận rõ ràng (VD "A8_v4 OK").
- Nếu phát hiện lỗi ở bước đang làm → ở lại bước đó sửa (ra bản `_v2`, `_v3`...), không lấy bước mới để né lỗi cũ. Nếu là hạ tầng mới ảnh hưởng toàn app (không phải lỗi riêng của 1 tính năng) → tách thành bước chữ mới (VD A9), như đã làm lần này.
- Các bước có gắn 🎯 (rủi ro cao — hiện đã áp dụng cho A6, A7, A8, B3, B4, B6) bắt buộc phải mô phỏng 3-5 tình huống thất bại thực tế trước khi báo xong.
- File chi tiết kỹ thuật từng bước nằm ở `QA/SoGym_[tên bước]_QA.md`; roadmap đầy đủ (rất chi tiết, dài) được lưu trong bộ nhớ trợ lý — file này chỉ là bản tóm tắt trực quan để bạn theo dõi nhanh.
