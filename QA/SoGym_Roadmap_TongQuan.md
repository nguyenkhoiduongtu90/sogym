# 🗺️ SỔ GYM — Roadmap Tổng Quan (cập nhật: 2026-08-21)

> **File này là bản TỔNG QUAN duy nhất, luôn được ghi đè trực tiếp mỗi khi có cập nhật** — không tạo file đánh số mới. Muốn xem chi tiết kỹ thuật đầy đủ từng version/bug/fix, xem các file `QA/SoGym_[step]_QA.md` riêng từng bước.

---

## 📍 Đang ở đâu ngay bây giờ

```
Bước hiện tại:   A6 — Data Management (Quản lý dữ liệu)
Trạng thái:      🟡 Đã code xong + test xong (bản v2), CHỜ BẠN XÁC NHẬN "A6_v2 OK"
File đang chờ:   SoGym_A6_v2.html  (v1 đã bị thay thế — theo yêu cầu, tự giả lập thêm 5 tình
                 huống thất bại ở luồng Restore/đa-tab, tìm ra 4 lỗi thật, đã tự sửa xong cả 4)
Việc bạn cần làm: Dùng thử A6_v2, nếu ổn thì nhắn "A6_v2 OK" để đi tiếp
```

---

## 📊 Tiến độ tổng thể

**Giai đoạn A (Core app):** 6/9 bước xong · 1 bước đang chờ xác nhận · 2 bước chưa bắt đầu
`[██████████████░░░░░░] ~67%`

**Giai đoạn B (AI):** 0/6 bước — chưa bắt đầu (chỉ bắt đầu sau khi Giai đoạn A xong hoàn toàn)
`[░░░░░░░░░░░░░░░░░░░░] 0%`

**Tổng cộng toàn dự án:** 6/15 bước lớn đã xong ✅ · 1 bước chờ xác nhận 🟡 · 8 bước chưa bắt đầu ⚪
`[████████░░░░░░░░░░░░] ~40%`

**Còn lại để xong Giai đoạn A (app dùng được hoàn chỉnh, chưa có AI):** 3 bước nữa (A6 xác nhận xong → A7 → A8)

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
| **A6** | **Quản lý dữ liệu** | 🟡 **Chờ xác nhận "A6_v2 OK"** | Xóa toàn bộ dữ liệu + Rà soát tự sửa lỗi dữ liệu + Sao lưu/Khôi phục. v1→v2: tự giả lập thêm 5 tình huống thất bại, tìm+tự sửa 4 lỗi (Restore không reset state cũ, input file không clear khi hủy, dữ liệu lồng lỗi làm Restore báo nhầm "hỏng", đa-tab không đồng bộ đúng khi Reset) |
| A7 | Google Sheets / Sao lưu online | ⚪ Chưa bắt đầu | Liên kết Google Account, sao lưu thủ công lên Sheets |
| A8 | Dinh dưỡng / Chỉ số cơ thể | ⚪ Chưa bắt đầu | Calo, cân nặng, % mỡ/cơ, mục tiêu |

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

## 🔜 Sau khi A6 được xác nhận "OK", các bước tiếp theo sẽ là

1. **A7 — Google Sheets / Sao lưu online**
2. **A8 — Dinh dưỡng / Chỉ số cơ thể**
3. → Hoàn tất Giai đoạn A → bắt đầu Giai đoạn B (AI)

---

## 📌 Quy tắc đang áp dụng (nhắc nhanh)

- Đi tuần tự từng bước, không nhảy cóc. Mỗi bước chỉ qua bước kế khi bạn xác nhận rõ ràng (VD "A6_v2 OK").
- Nếu phát hiện lỗi ở bước đang làm → ở lại bước đó sửa (ra bản `_v2`, `_v3`...), không lấy bước mới để né lỗi cũ.
- Các bước có gắn 🎯 (rủi ro cao — hiện đã áp dụng cho A6, A7, A8, B3, B4, B6) bắt buộc phải mô phỏng 3-5 tình huống thất bại thực tế trước khi báo xong.
- File chi tiết kỹ thuật từng bước nằm ở `QA/SoGym_[tên bước]_QA.md`; roadmap đầy đủ (rất chi tiết, dài) được lưu trong bộ nhớ trợ lý — file này chỉ là bản tóm tắt trực quan để bạn theo dõi nhanh.
