# Hướng dẫn sử dụng Sổ Gym

Mở link app đang dùng (`SoGym_A_Final_Optimized_v24.html`, ví dụ qua GitHub Pages) bằng trình duyệt trên điện thoại. App tự động lưu liên tục — không cần bấm "lưu" gì thêm ngoài các nút Lưu được nêu bên dưới. Không cần mạng để dùng, trừ lúc sao lưu/khôi phục lên Google Sheets — dải trạng thái nhỏ ở đầu màn hình cho biết đang **Online** hay **Offline**, chỉ để biết chứ không chặn thao tác gì.

App có 5 tab dưới cùng: **Hôm nay** · **Chọn bài** · **Nhập set** · **Lịch sử** · **Cơ thể**.

---

## 1. Ghi một buổi tập

1. Vào tab **Hôm nay** → bấm **"Bắt đầu buổi tập"**.
2. Bấm **"Thêm bài tập"** → gõ tên bài cần tìm, hoặc bấm 1 trong các bộ lọc (Tất cả / ★ Yêu thích / Không cần máy / Máy chuyên biệt / Máy cáp / Máy Smith) → chạm vào bài muốn tập → (có thể sửa tên tiếng Việt/nhóm cơ nếu muốn) → bấm **"Thêm ... vào buổi tập"**.
3. Ở màn Hôm nay, chạm vào tên bài vừa thêm để mở màn ghi set.
4. Nhập số **Reps** và **Tạ (kg)** → bấm **"Ghi nhận set"**. Lặp lại cho mỗi set. Bảng set hiện thêm cột **1RM** (mức tạ 1 lần đẩy tối đa ước tính theo công thức Epley) cho từng set. Nếu set vừa ghi vượt kỷ lục tạ cũ của bài đó, app tự hiện **"Kỷ lục mới"**; nếu chưa vượt, hiện kỷ lục cũ kèm ngày đạt được.
5. Muốn nghỉ giữa các set: bấm **"Bắt đầu nghỉ"** (có thể chỉnh **+15s / -15s**, **↺ Đặt lại**, hoặc **"Bỏ qua, tập tiếp luôn"**). Thời gian nghỉ gợi ý được tính từ trung bình thời gian nghỉ thực tế bạn đã dùng cho bài đó ở các buổi trước; nếu bài chưa có lịch sử, app dùng mặc định chung.
6. Set ghi sai: bấm biểu tượng **✎** để sửa, hoặc **🗑** để xoá set đó.
7. Tập xong bài đó: bấm **"Hoàn thành bài này"** để quay lại Hôm nay và thêm bài tiếp theo.
8. Muốn xoá cả 1 bài khỏi buổi tập: bấm **✕** cạnh tên bài. Muốn đánh dấu bài yêu thích: bấm **★**.
9. Có tập cardio: bấm **"Thêm Cardio"** → nhập Loại hình, Thời gian (phút), Quãng đường (km), Calo (nếu máy có hiển thị) → **"Lưu Cardio"**.
10. Tập xong toàn bộ buổi: bấm **"Kết thúc buổi tập"**.

## 2. Thêm bài tập không có sẵn trong danh sách

Ở màn **Chọn bài**, bấm **"+ Bài tập khác (không có sẵn)"** → điền Tên bài, Nhóm cơ tác động chính, Loại thiết bị → bấm **"Lưu bài tập mới"**.

## 3. Xem lại lịch sử tập

1. Vào tab **Lịch sử**.
2. Lọc theo **7 ngày / 30 ngày / Tháng này / Tất cả**, hoặc tự chọn **Từ ngày – Đến ngày**.
3. Chạm vào 1 buổi tập trong danh sách để xem chi tiết từng bài, từng set.
4. Trong phần chi tiết: bấm **✎** để sửa hoặc **🗑** để xoá 1 set; bấm **"🗑 Xoá buổi tập này"** để xoá nguyên buổi.

## 4. Sao lưu và khôi phục dữ liệu

Vẫn ở tab **Lịch sử**:

- **Xuất Excel**: bấm **"Xuất Excel"** để tải file thống kê chi tiết (buổi tập, kỷ lục cá nhân...).
- **Sao lưu ra file**: bấm biểu tượng 💾 để tải file sao lưu (.json) về máy — nên làm định kỳ để không mất dữ liệu.
- **Khôi phục từ file**: bấm **"Khôi phục từ file sao lưu"** → chọn file .json đã lưu trước đó.
- **Sao lưu lên Google Sheets**: bấm **"Sao lưu lên Google Sheets"** → lần đầu sẽ hỏi đăng nhập tài khoản Google → dữ liệu lưu vào Google Sheets của chính bạn (mỗi lần sao lưu thêm 1 dòng mới, không ghi đè dòng cũ).
- **Khôi phục từ Google Sheets**: bấm **"Khôi phục từ Google Sheets"** → app liệt kê tối đa 20 bản sao lưu gần nhất trên Sheet → chạm chọn đúng bản (theo thời điểm sao lưu) muốn áp dụng.
- **Xoá toàn bộ dữ liệu**: bấm **"Xóa toàn bộ dữ liệu"** → xác nhận, sau đó gõ đúng chữ **XÓA** rồi bấm OK. Thao tác này **không thể hoàn tác** — nên sao lưu trước khi xoá.

## 5. Theo dõi cơ thể

Vào tab **Cơ thể**:

1. **Nhập chỉ số theo ngày**: chọn ngày (mặc định là hôm nay, chọn được cả ngày cũ) → nhập Cân nặng (kg), Calo nạp (kcal), % Mỡ cơ thể, % Cơ, Ghi chú (tối đa 100 ký tự) — ô nào không có số liệu thì để trống → bấm **"Lưu chỉ số"**.
2. **Đặt mục tiêu**: ở khung **🎯 Mục tiêu**, chạm vào từng ô (Cân nặng / % Mỡ cơ thể / % Cơ / Calo/ngày) → nhập số mục tiêu mong muốn → OK. Để trống rồi OK để xoá mục tiêu đó.
3. **Xem xu hướng**: khung **📈 Xu hướng** hiện biểu đồ Cân nặng/% Mỡ/% Cơ theo thời gian (cần nhập ít nhất 2 ngày mới có biểu đồ).
4. **Lịch sử Cơ thể**: khung **🗂 Lịch sử Cơ thể** liệt kê toàn bộ số liệu đã nhập theo ngày.

## 6. Lưu ý khác

- App chỉ hiển thị ở chế độ dọc màn hình. Nếu xoay ngang điện thoại, màn hình sẽ nhắc xoay lại dọc.
- Mỗi lần mở app, màn hình chờ sẽ hiện 1 hình linh vật ngẫu nhiên khác nhau — chỉ là hình trang trí, không ảnh hưởng gì đến dữ liệu.
