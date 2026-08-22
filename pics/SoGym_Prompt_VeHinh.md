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

---

## 5. Icon còn thiếu cho các nút hành động (bổ sung 2026-08-21)

Đã rà lại toàn bộ code thật (`SoGym_A7_v5.html`) và xác nhận: 4 icon tab dưới, 3 icon "nghỉ giữa set", icon màn trống, ảnh nền toàn app, banner ngang, và icon của nút Bắt đầu buổi tập/Thêm Cardio **đã được ghép vào code rồi** (đúng như mục 1-4 ở trên). Các nút dưới đây thì **CHƯA có icon riêng** (chỉ có chữ hoặc emoji có sẵn của hệ điều hành) — cần vẽ bổ sung.

**Định dạng: giống hệt mục 2 (PNG vuông 256x256px, vẽ trực tiếp trên nền đặc — ghi rõ đúng mã màu nền của TỪNG nút bên dưới vì không phải nút nào cũng cùng 1 màu nền).**

**PROMPT (dùng chung, đổi phần "biểu tượng cho" và "nền" mỗi lần tạo 1 icon khác):**
```
Create a single simple flat icon, centered, on a solid-color background exactly [ĐIỀN MÃ MÀU NỀN — xem bảng bên dưới] (no gradient, no texture on the background itself).
Style: [ĐIỀN VÀO ĐÂY: dùng ĐÚNG mô tả phong cách bạn đã dùng khi tạo các icon cũ trong thư mục pics/ — để đồng bộ 100%, nên đính kèm 1-2 icon cũ, ví dụ "ultra-simple line icon_home.png", làm ảnh tham chiếu phong cách cho AI xem trước khi vẽ]
The icon represents: [ĐIỀN VÀO ĐÂY — xem cột "Gợi ý biểu tượng" trong bảng bên dưới]
Keep the icon simple and bold enough to stay readable at small size (~24px) — avoid fine detail,
thin lines, or small text. Icon color: [ĐIỀN MÃ MÀU ICON — xem bảng]. Square format, 256x256px, PNG.
```

| Tên file cần đặt | Nút trong app | Nền vẽ icon (mã màu) | Màu icon | Gợi ý biểu tượng |
|---|---|---|---|---|
| `sogym_btnicon_logset.png` | "Ghi nhận set" (tab Nhập set) | `#121214` | `#c6ff3d` | dấu tích trên sổ tay / bút ghi số |
| `sogym_btnicon_startrest.png` | "Bắt đầu nghỉ" (tab Nhập set) | `#c6ff3d` (nền nút màu lime đặc) | `#1a2600` (tối, để nổi trên nền lime) | đồng hồ bấm giờ / nút play |
| `sogym_btnicon_endsession.png` | "Kết thúc buổi tập" (tab Hôm nay) | `#121214` | `#ff6b4a` (cam cảnh báo, khớp viền nút) | cờ đích / dấu tích lớn |
| `sogym_btnicon_exportcsv.png` | "Xuất Excel" (tab Lịch sử) | `#c6ff3d` | `#1a2600` | mũi tên xuống + bảng tính nhỏ |
| `sogym_btnicon_backupjson.png` | "💾 Sao lưu" (tab Lịch sử) | `#121214` | `#c6ff3d` | ổ đĩa lưu / đám mây có mũi tên xuống |
| `sogym_btnicon_resetall.png` | "🗑 Xóa toàn bộ dữ liệu" (tab Lịch sử) | `#121214` | `#ff6b4a` (cam cảnh báo) | thùng rác |
| `sogym_btnicon_gsheetbackup.png` | "☁️ Sao lưu lên Google Sheets" (tab Lịch sử) | `#121214` | `#c6ff3d` | đám mây + mũi tên lên |
| `sogym_btnicon_gsheetrestore.png` | "⬇ Khôi phục từ Google Sheets" (tab Lịch sử) | `#121214` | `#c6ff3d` | đám mây + mũi tên xuống |

---

## 6. Icon tròn nhỏ thay thế ký tự Unicode hiện có (trong thẻ danh sách bài tập)

**Mục đích:** 3 nút nhỏ hình tròn nằm trong mỗi dòng bài tập/cardio của buổi tập (tab Nhập set) hiện đang dùng ký tự chữ thô (★ ☆ ✕ ⧉) thay vì icon vẽ riêng.

**Định dạng:** PNG vuông **128x128px** (hiển thị nhỏ ~32-40px), vẽ trên nền đặc `#1c1c1f` (đúng màu nền thẻ card mà các nút này nằm trong, KHÔNG dùng `#121214` cho nhóm này).

**PROMPT (dùng chung, đổi phần biểu tượng):**
```
Create a single ultra-simple line icon, centered, on a solid background exactly #1c1c1f.
Style: [ĐIỀN VÀO ĐÂY: cùng phong cách với các icon khác, xem gợi ý đính kèm ảnh tham chiếu ở mục 5]
The icon represents: [ĐIỀN VÀO ĐÂY — xem bảng]
Extremely minimal silhouette, must stay recognizable at 32x32px. Single color only: [ĐIỀN MÃ MÀU — xem bảng].
No shading, no gradient, no fine detail. Square format, 128x128px, PNG.
```

| Tên file cần đặt | Vị trí trong app | Màu icon | Gợi ý biểu tượng |
|---|---|---|---|
| `sogym_glyph_fav_off.png` | Nút yêu thích — trạng thái CHƯA đánh dấu | `#6b6b72` (xám) | ngôi sao viền rỗng |
| `sogym_glyph_fav_on.png` | Nút yêu thích — trạng thái ĐÃ đánh dấu | `#ffc93d` (vàng) | ngôi sao đặc |
| `sogym_glyph_remove.png` | Nút xoá 1 bài/cardio khỏi buổi tập đang dở | `#a3a3aa` (xám nhạt) | dấu X hoặc thùng rác nhỏ |
| `sogym_glyph_copyprev.png` | Nút copy số liệu (reps/kg) từ set trước | `#c6ff3d` (lime) | 2 tờ giấy chồng lên nhau (copy) |

---

## 7. Icon thay thế khi ảnh bài tập lỗi/mất mạng

**Mục đích:** hiện khi ảnh bài tập (tải từ GitHub) bị lỗi hoặc chưa từng cache mà đang offline, app hiện tạm emoji 🏋 mặc định của điện thoại — muốn thay bằng icon tự vẽ cho đồng bộ phong cách.

**Định dạng:** PNG vuông **256x256px**, vẽ trên nền đặc `#26262a` (đúng màu nền ô ảnh đại diện bài tập).

**PROMPT:**
```
Create a single simple flat icon, centered, on a solid background exactly #26262a.
Style: [ĐIỀN VÀO ĐÂY: cùng phong cách với các icon khác]
The icon represents: a dumbbell or barbell, used as a placeholder image when an exercise photo
fails to load. Keep it simple and bold enough to stay readable at 48x48px. Icon color: #c6ff3d.
Square format, 256x256px, PNG.
```

**Tên file cần đặt:** `sogym_fallback_exercise_thumb.png`

---

## 8. Bộ nhân vật mascot ngẫu nhiên khi mở/đóng app (MỚI)

**Mục đích:** hiện màn hình chờ lúc mở app (splash screen) chỉ có 1 logo tĩnh duy nhất. Muốn thay bằng **1 bộ nhiều nhân vật/tư thế khác nhau** (cùng 1 phong cách nhất quán), mỗi lần mở app code sẽ chọn ngẫu nhiên 1 nhân vật để hiện — tạo cảm giác sinh động, đổi mới mỗi lần mở.

**Số lượng đề xuất:** 6-8 nhân vật/tư thế khác nhau (nhiều hơn thì random cảm giác đa dạng hơn, nhưng cũng tốn công vẽ hơn — 6-8 là mức vừa đủ để không lặp lại quá nhanh khi mở app nhiều lần trong ngày).

**Định dạng:** PNG vuông **512x512px** mỗi nhân vật, vẽ trên nền đặc `#121214` (đúng màu nền `#splashScreen`, đã bao gồm cả logo tĩnh hiện tại — nên đính kèm logo cũ làm ảnh tham chiếu phong cách, xem cách lấy file bên dưới).

**PROMPT (dùng chung, đổi số thứ tự/tư thế mỗi lần tạo 1 nhân vật):**
```
Create a single friendly character illustration, centered, on a solid background exactly #121214
(near-black, no gradient, no texture on the background itself).
Style: [ĐIỀN VÀO ĐÂY: cùng phong cách với toàn bộ icon khác trong app — nên đính kèm ảnh logo cũ
(reference_current_logo.png) làm ảnh tham chiếu để AI giữ đúng phong cách nhân vật/nét vẽ]
Character / pose #[SỐ THỨ TỰ 1-8]: [ĐIỀN VÀO ĐÂY — ví dụ: "doing a push-up", "flexing biceps",
"drinking water after workout", "stretching", "giving a thumbs up", "resting on a dumbbell" —
mỗi lần đổi 1 tư thế/hoạt động khác nhau, cùng 1 nhân vật hoặc vài nhân vật khác nhau đều được]
Mood: energetic, motivating, friendly — fits a workout-tracking app splash screen. Main colors:
lime-green #c6ff3d as accent, off-white #f4f4f0 for line work/highlights, staying within the
dark #121214 background. No text, no logos. Square format, 512x512px, PNG.
```

**Tên file cần đặt:** `sogym_mascot_01.png`, `sogym_mascot_02.png`, ... lần lượt tới `sogym_mascot_08.png` (đánh số theo đúng thứ tự tạo, không cần theo thứ tự tư thế cụ thể nào).

**Ảnh tham chiếu logo hiện tại:** đã trích xuất sẵn tại `design_assets/reference_current_logo.png` (180x180px, chính là logo/app-icon đang dùng thật trong app) — đính kèm file này khi nhắn AI vẽ mascot để giữ đúng phong cách nhân vật cũ nếu logo cũ vốn đã là 1 nhân vật/linh vật.

---

## Quy ước đặt tên file (áp dụng cho toàn bộ mục 5-8 ở trên)

Đặt tên đúng theo bảng ở mỗi mục — đây là quy ước để sau này gửi lại cho Claude, Claude sẽ tự tra tên file để biết chính xác ghép vào đâu trong code, không cần giải thích lại từ đầu. Quy tắc chung: `sogym_<nhóm>_<vị trí>.png`, trong đó nhóm là `btnicon` (icon trong nút hành động), `glyph` (icon tròn nhỏ thay ký tự Unicode), `fallback` (ảnh thay thế khi lỗi), `mascot` (nhân vật màn splash).

---

## 9. Icon còn thiếu cho tab "Cơ thể" (bổ sung 2026-08-22, sau khi thêm tab A8)

**Cách đọc mục này:** mỗi mục con dưới đây có 2 phần rõ rệt:
- 🟩 **"COPY CHO AI THIẾT KẾ"** — khối này copy **y nguyên**, dán thẳng vào ChatGPT (hoặc AI vẽ ảnh khác). Không thêm/bớt gì ngoài phần `[ĐIỀN VÀO ĐÂY: ...]`.
- ⬜ **"Giải thích (không copy)"** — chỉ để bạn hiểu bối cảnh/vì sao cần ảnh này, AI thiết kế không cần đọc phần này, **đừng dán phần này vào AI**.

Đã rà code thật (`SoGym_A8_v4.html`) để xác định đúng những gì còn thiếu — không phải mọi thứ trong tab Cơ thể đều thiếu ảnh:
- 4 tiêu đề thẻ trong tab Cơ thể (📋 Nhập chỉ số / 🎯 Mục tiêu / 📈 Xu hướng / 🗂 Lịch sử Cơ thể) dùng emoji hệ điều hành — **giống hệt cách mọi tiêu đề thẻ khác trong app đã làm từ trước** (vd 🏃 Cardio buổi này, ☁️ Sao lưu Google Sheets), nên đây không phải chỗ thiếu, không cần vẽ.
- Nút ✎ (sửa) / 🗑 (xoá) trong Lịch sử Cơ thể cũng dùng ký tự có sẵn — **giống hệt** cách các nút sửa/xoá khác trong toàn app đã làm (tab Lịch sử, tab Nhập set), nên cũng không thiếu.
- Chỉ có **2 chỗ thực sự thiếu ảnh riêng** để tab Cơ thể đạt cùng mức hoàn thiện hình ảnh như các tab khác: (9.1) icon tab điều hướng dưới cùng, hiện đang tạm dùng emoji ⚖️; (9.2) icon cho nút chính "Lưu chỉ số".

### 9.1 Icon tab điều hướng "Cơ thể" (thay thế tạm thời ⚖️)

⬜ **Giải thích (không copy):** đây là icon nhỏ trong thanh tab dưới cùng, cùng hàng với 4 icon Hôm nay/Chọn bài/Nhập set/Lịch sử đã có sẵn (xem mục 3 ở trên) — icon thứ 5 này còn thiếu, tab đang tạm hiện chữ emoji ⚖️ thay thế. Định dạng giống hệt mục 3: PNG vuông 128x128px, nền `#121214`, 1 màu duy nhất `#c6ff3d`.

🟩 **COPY CHO AI THIẾT KẾ:**
```
Create a single ultra-simple line icon, centered, on a solid background exactly #121214.
Style: [ĐIỀN VÀO ĐÂY: dùng ĐÚNG mô tả phong cách bạn đã dùng cho 4 icon tab cũ (Hôm nay/Chọn
bài/Nhập set/Lịch sử) — nên đính kèm 1 icon tab cũ làm ảnh tham chiếu để AI vẽ đúng cùng bộ]
The icon represents: body measurement / body composition tracking — e.g. a simple weighing
scale, or a body silhouette with a small measuring line.
Extremely minimal silhouette style — must stay recognizable at 22x22px. Single color only:
lime-green #c6ff3d. No shading, no gradient, no fine detail. Square format, 128x128px, PNG.
```

**Tên file cần đặt:** `sogym_navicon_body.png`

### 9.2 Icon nút "Lưu chỉ số" (nút chính trong form nhập chỉ số Cơ thể)

⬜ **Giải thích (không copy):** đây là nút chính (nền lime `#c6ff3d`, chữ tối `#1a2600`) để lưu cân nặng/calo/%mỡ/%cơ/ghi chú trong tab Cơ thể — cùng loại nút với "Bắt đầu nghỉ" đã được vẽ icon riêng ở mục 5, nên nên vẽ icon cho nút này để đồng bộ. Định dạng giống hệt mục 5: PNG vuông 256x256px, vẽ trên nền lime đặc.

🟩 **COPY CHO AI THIẾT KẾ:**
```
Create a single simple flat icon, centered, on a solid-color background exactly #c6ff3d
(no gradient, no texture on the background itself).
Style: [MUTANT ORC GYM STYLE]
The icon represents: saving/confirming data, such as a checkmark, a save/disk symbol, or a
small clipboard with a checkmark.
Keep the icon simple and bold enough to stay readable at small size (~24px) — avoid fine detail,
thin lines, or small text. Icon color: #1a2600 (dark, to stay legible on the lime background).
Square format, 256x256px, PNG.
```

**Tên file cần đặt:** `sogym_btnicon_savebody.png`

---

## 10. Về các "bảng thông báo nền trắng" bạn hỏi (alert/confirm) — KHÔNG phải việc vẽ ảnh

Mục này **không có prompt để copy** — đây là giải thích, vì đây không phải vấn đề thiếu ảnh.

Bảng bạn chụp màn hình gửi ("Buổi tập chưa có bài tập... Kết thúc mà không lưu gì?") là hộp thoại **gốc của trình duyệt/hệ điều hành** (`window.confirm()` — cùng họ với `alert()` và `prompt()` mà app đang dùng ở khoảng 35 chỗ trong code, ví dụ cả 3 lần hỏi xác nhận đặt mục tiêu ở tab Cơ thể cũng dùng `prompt()`). Loại hộp thoại này **không thể đổi màu/kiểu bằng CSS hay bằng ảnh** trong bất kỳ trình duyệt nào — đây là giới hạn bảo mật của trình duyệt (web page không được phép tự vẽ lại UI hệ thống), không phải lỗi hay thiếu sót của app.

Cách duy nhất để bảng thông báo mang đúng phong cách tối/lime của app là **viết lại bằng code** — tự dựng 1 khung "modal" nổi lên giữa màn hình (nền `#1c1c1f` như thẻ card, nút bấm lime `#c6ff3d`, giống hệt phong cách sẵn có của app), rồi thay toàn bộ các chỗ đang gọi `alert()`/`confirm()`/`prompt()` sang gọi khung này thay vì hộp thoại gốc. Đây là việc code, không cần AI vẽ ảnh (trừ khi bạn muốn thêm 1 icon nhỏ trang trí bên trong khung, ví dụ dấu ⚠️/✓ tự vẽ — nếu muốn, báo tôi sẽ viết thêm prompt riêng).

Vì đây là thay đổi xuất hiện ở **~35 chỗ trên toàn bộ app** (không riêng tab Cơ thể), không phải việc nhỏ tiện tay sửa — nên tôi chưa tự làm, cần bạn quyết định trước khi tôi bắt tay vào.

## Sau khi có ảnh — bạn gửi lại cho tôi

Gửi file ảnh (hoặc mô tả bạn đã lưu ở đâu), tôi sẽ:
1. Kiểm tra kích thước/định dạng có đúng không
2. Ghép vào đúng vị trí trong code (CSS `background-image` cho ảnh nền, `<img>` hoặc CSS `background` cho icon) — riêng bộ mascot (mục 8) sẽ cần thêm chút code JS để chọn ngẫu nhiên 1 ảnh mỗi lần mở app, thay cho logo tĩnh hiện tại
3. Test lại để đảm bảo không vỡ giao diện, chữ vẫn đọc rõ, rồi mới báo hoàn thành
