# Prompt vẽ hình cho app Sổ Gym — dùng với ChatGPT (GPT Image)

## Cách dùng file này
Mỗi mục dưới đây là 1 prompt riêng, dùng cho 1 ảnh (hoặc 1 bộ ảnh cùng loại). Copy nguyên khối "PROMPT" vào ChatGPT. Chỗ `[ĐIỀN VÀO ĐÂY: ...]` là phần bạn tự điền phong cách/chủ đề (ví dụ: "phong cách cute, màu pastel" hoặc "phong cách skullcandy, gai góc, tối màu"). Phần còn lại (bố cục, kích thước, màu nền, giới hạn kỹ thuật) đã được tôi viết sẵn — **không nên sửa phần này** vì nó khớp với thông số thật của app.

**Bảng màu app hiện tại (để bạn tham chiếu khi chọn phong cách sao cho hợp tông):**
| Vai trò | Mã màu |
|---|---|
| Nền chính (gần đen) | `#121214` |
| Nền thẻ/card | `#1c1c1f` |
| Màu nhấn (xanh chanh) | `#c6ff3d` |
| Chữ chính | `#f4f4f0` |

**Lưu ý kỹ thuật quan trọng:** ChatGPT (GPT Image) hiện **không xuất được nền trong suốt thật** dù có yêu cầu trong prompt — đây là giới hạn của công cụ, không phải lỗi prompt. Vì app đã nền tối gần như đen tuyền, mọi prompt icon dưới đây yêu cầu vẽ **trực tiếp trên nền màu `#121214`** (khớp app) thay vì xin nền trong suốt — khi ghép vào sẽ liền mạch, không cần xử lý thêm. Nếu ghép vào thấy vẫn lộ viền nhẹ do màu không khớp tuyệt đối 100%, báo lại tôi sẽ đưa bạn cách phụ (kỹ thuật tách nền bằng cách tạo 2 bản nền trắng/đen rồi so sánh) — nhưng nên thử cách đơn giản trước.

---

## 1. Ảnh nền toàn app (background)

**Mục đích:** hiển thị mờ phía sau toàn bộ giao diện, chủ yếu lộ ra ở khoảng trống quanh các thẻ card (bản thân card đã có nền riêng che chữ, nên ảnh nền không đè trực tiếp lên chữ ở hầu hết chỗ).

**Định dạng:** PNG hoặc JPEG, hoạ tiết có thể lặp lại (tileable/seamless pattern), kích thước vuông **1024x1024px**.

**Độ đậm nhạt:** tôi đề xuất mức **vừa phải, nghiêng nhẹ về phía tối giản** — không quá rực/chi tiết dày đặc (dễ rối mắt khi cuộn dài), nhưng cũng không quá mờ nhạt tới mức vô hình (uổng công có ảnh). Đã ghi rõ trong prompt bên dưới.

**PROMPT:**
```
Create a seamless, tileable background pattern for a dark-mode mobile fitness app.
Base background color: solid near-black #121214.
Style: [ĐIỀN VÀO ĐÂY: phong cách/chủ đề, ví dụ "cute minimal doodles" hoặc "skullcandy gritty street style"]
The pattern should be subtle and low-contrast — faint linework or small motifs only slightly
lighter than the background, NOT bold or busy, so it stays comfortable behind long scrolling
text content. Include a few sparse accent details in lime-green #c6ff3d, used sparingly (not
dominating the pattern). No text, no logos, no photorealistic photography — flat or line-art
style only. Square format, seamlessly tileable in all directions, 1024x1024px, PNG or JPEG.
```

---

## 2. Icon cho các nút chính

**Mục đích:** icon nhỏ đi kèm chữ trên các nút hành động chính (Bắt đầu buổi tập, Thêm bài tập, Thêm Cardio...).

**Định dạng:** PNG, vuông **256x256px** mỗi icon, vẽ trên nền đặc `#121214`.

**PROMPT (dùng chung, đổi phần "biểu tượng cho" mỗi lần tạo 1 icon khác):**
```
Create a single simple flat icon, centered, on a solid solid-color background exactly #121214
(near-black, no gradient, no texture on the background itself).
Style: [ĐIỀN VÀO ĐÂY: phong cách/chủ đề — nên giữ giống phong cách bạn chọn ở ảnh nền để đồng bộ]
The icon represents: [ĐIỀN VÀO ĐÂY — ví dụ: "a dumbbell", "a plus/add symbol", "a running person for cardio", "a stopwatch/timer"]
Keep the icon simple and bold enough to stay readable at small size (24-32px) — avoid fine
detail, thin lines, or small text. Use lime-green #c6ff3d as the main icon color, or white
#f4f4f0 if more legible for that shape. Square format, 256x256px, PNG.
```
*Gợi ý các nút cần icon: Bắt đầu buổi tập, Thêm bài tập, Thêm Cardio, Ghi nhận set, Bắt đầu nghỉ, Kết thúc buổi tập — bạn không bắt buộc làm hết, có thể chọn vài nút quan trọng nhất trước.*

---

## 3. Icon 4 tab dưới cùng

**Mục đích:** icon nhỏ trong thanh điều hướng, 4 tab: Hôm nay, Chọn bài, Nhập set, Lịch sử.

**Định dạng:** PNG, vuông **128x128px** mỗi icon (nhỏ hơn nút chính vì hiển thị chỉ ~22px) — nền cũng `#121214`.

**PROMPT (dùng chung, đổi phần biểu tượng 4 lần):**
```
Create a single ultra-simple line icon, centered, on a solid background exactly #121214.
Style: [ĐIỀN VÀO ĐÂY: cùng phong cách với 2 phần trên để đồng bộ toàn app]
The icon represents: [ĐIỀN VÀO ĐÂY — lần lượt 4 icon:
 1) "today / home, like a small house or calendar with today marked"
 2) "search or pick an exercise, like a magnifying glass over a dumbbell"
 3) "logging a workout set, like a pencil writing on a checklist"
 4) "history, like a clock with a backward arrow"]
Extremely minimal silhouette style — must stay recognizable at 22x22px. Single color only:
lime-green #c6ff3d. No shading, no gradient, no fine detail. Square format, 128x128px, PNG.
```

---

## 4. Hình minh hoạ màn hình trống (chưa bắt đầu buổi tập)

**Mục đích:** hình lớn, thân thiện, hiện giữa màn hình Trang chủ khi chưa bấm "Bắt đầu buổi tập".

**Định dạng:** PNG, **800x800px**, vẽ trên nền đặc `#121214`.

**PROMPT:**
```
Create a friendly, inviting illustration for an empty state screen in a dark-mode fitness app —
shown before the user starts their workout for the day. Centered composition, solid background
exactly #121214.
Style: [ĐIỀN VÀO ĐÂY: phong cách/chủ đề, đồng bộ với các phần trên]
Content: [ĐIỀN VÀO ĐÂY — ví dụ: "a friendly cartoon dumbbell character waving", "a minimal
line-art figure about to lift weights", tuỳ bạn]
The mood should feel motivating and welcoming, not intimidating. Main colors: lime-green
#c6ff3d as accent, off-white #f4f4f0 for line work, staying within the dark #121214 background.
No text, no logos. Square format, 800x800px, PNG.
```

---

## Sau khi có ảnh — bạn gửi lại cho tôi

Gửi file ảnh (hoặc mô tả bạn đã lưu ở đâu), tôi sẽ:
1. Kiểm tra kích thước/định dạng có đúng không
2. Ghép vào đúng vị trí trong code (CSS `background-image` cho ảnh nền, `<img>` hoặc CSS `background` cho icon)
3. Test lại để đảm bảo không vỡ giao diện, chữ vẫn đọc rõ, rồi mới báo hoàn thành
