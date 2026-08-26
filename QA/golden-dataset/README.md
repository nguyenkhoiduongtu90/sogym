# Golden Dataset — Sổ Gym

## Mục đích

Bảo vệ dữ liệu khỏi lỗi âm thầm khi sửa code lớn. Nhiều lỗi (tính sai PR, sai
Volume, sai Mục tiêu, hỏng lịch sử) **không làm app crash** — nếu chỉ test
bằng cách bấm thử vài màn hình thì rất dễ bỏ sót. Golden Dataset giải quyết
đúng lỗ hổng này: so sánh kết quả tính toán trên **cùng một dữ liệu thật**,
chạy qua 2 phiên bản code (trước và sau khi sửa) — nếu có bất kỳ con số nào
lệch mà không giải thích được bằng đúng thay đổi vừa làm, đó là dấu hiệu bug.

Công cụ: `.scratch/golden_dataset_tool.py` (Python, không cần thư viện ngoài).

## Khi nào dùng

Dùng cho các thay đổi rủi ro cao: sửa Data Layer, đổi cách tính PR/1RM/Volume/
Mục tiêu, sửa luồng Backup/Restore JSON hoặc Google Sheets, đổi
normalizeDataModelV3/migrateData. **Không cần** dùng cho sửa lỗi UI nhỏ,
đổi màu, đổi text.

## Quy trình

1. **Trước khi sửa code**: mở app bản đang chạy (vd v11), tab Lịch sử → bấm
   "Sao lưu JSON" → được file (vd `SoGym_SaoLuu_2026-08-26.json`).
2. Chạy:
   ```
   python .scratch/golden_dataset_tool.py capture SoGym_SaoLuu_2026-08-26.json QA/golden-dataset/golden_snapshot_v11.json
   ```
3. Sửa code, tạo bản mới (vd v12).
4. Mở bản v12, dùng "Khôi phục JSON" nạp **đúng file backup ở bước 1** vào v12.
5. Ở v12 (sau khi restore xong), bấm "Sao lưu JSON" lại lần nữa → được file
   mới (vd `SoGym_SaoLuu_v12_check.json`).
6. Chạy:
   ```
   python .scratch/golden_dataset_tool.py compare QA/golden-dataset/golden_snapshot_v11.json SoGym_SaoLuu_v12_check.json
   ```
7. Đọc kết quả PASS/FAIL. Nếu FAIL ở chỗ không liên quan gì tới thay đổi vừa
   làm — đó là dấu hiệu code mới làm sai lệch dữ liệu, cần xem lại trước khi
   coi bước sửa là xong.

**Lưu ý quan trọng**: đây là so sánh dữ liệu **giống hệt nhau** chạy qua 2 code
khác nhau — không phải so dữ liệu thật ở 2 thời điểm khác nhau (dữ liệu thật sẽ
luôn khác nhau theo thời gian vì bạn tập thêm, đó là bình thường, không phải lỗi).

Nếu bản sửa **cố ý** thay đổi một giá trị (ví dụ v11 cố ý bù `rm` còn thiếu
bằng Epley — đây chính là BUG-02 đã sửa), phần FAIL tương ứng là **kỳ vọng**,
không phải lỗi mới — chỉ cần xác nhận đúng đó là thay đổi đã định làm, rồi ghi
chú lại (không cần snapshot lại golden trừ khi muốn baseline mới).

## Các chỉ số được kiểm tra

Đối chiếu trực tiếp từ source thật `SoGym_A_Final_Optimized_v11.html`:

| Chỉ số | Công thức / logic (khớp đúng app) |
|---|---|
| `session_count`, `total_sets` | Đếm buổi tập, số set hợp lệ trong `history` |
| `total_volume_kg` | Σ (reps × weight) mọi set |
| `pr_by_exercise` | Tạ nặng nhất từng đạt (`max weight`), khớp theo **tên bài** — giống hệt `allTimeMaxByExercise()`. Lưu ý: PR là theo tạ nặng nhất, **không phải** theo 1RM. |
| `workout_target_by_exercise` | Trung bình có trọng số từ tối đa 9 buổi gần nhất có bài đó — giống hệt `computeWorkoutTarget()` |
| `epley_mismatch_count` | Số set có `rm` lưu không khớp Epley `weight*(1+reps/30)` (sai số > 0.05) |
| `integrity` | Số session null/hỏng, số bài không có set hợp lệ nào |

## File trong thư mục này

- `README.md` — file này.
- `golden_snapshot_*.json` — các snapshot đã chụp (đặt tên theo version baseline, vd `golden_snapshot_v11.json`). **Chưa có file nào ở đây** — cần chạy `capture` trên Backup JSON thật của bạn trước.

## Giới hạn

Đây là công cụ hỗ trợ phát hiện sớm, không thay thế việc kiểm thử thật qua
Claude Preview MCP/trình duyệt thật theo đúng kỷ luật quy trình đã có. Không
kiểm tra UI, không kiểm tra luồng OAuth Google Sheets (vẫn cần mô phỏng tay
theo quy tắc 🎯 cho các bước rủi ro cao).
