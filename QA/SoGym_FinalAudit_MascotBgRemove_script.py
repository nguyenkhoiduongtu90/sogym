# Final Audit — bổ sung ngoài 5 batch (2026-08-24)
# Tách nền đen cho 8 ảnh mascot bằng flood-fill từ mép ảnh vào trong.
# Vì sao flood-fill từ mép thay vì thay màu toàn cục (global color replace):
# nhân vật trong ảnh CŨNG chứa các vùng đen/gần-đen (áo tank-top đen, băng cổ tay,
# giày) — nếu thay toàn bộ pixel gần-đen thành trong suốt thì sẽ khoét lỗ ngay
# trên nhân vật. Flood-fill từ 4 mép vào chỉ lan tới các pixel gần-đen LIÊN THÔNG
# với nền ngoài cùng, dừng lại đúng tại viền sáng bao quanh nhân vật (đã quan sát
# trực tiếp qua ảnh: viền character có outline sáng rõ, ngăn cách hẳn với nền đen).
import sys
from PIL import Image
from collections import deque

THRESHOLD = 30  # nguong khoang cach mau toi da (Euclid) tinh la "nen den"
# nguong 30 chon dua tren pixel goc thuc do (6,6,6)-(6,6,7) tren anh 01/02 --
# vung nen rat dong deu gan (6,6,6), nen nguong nho van du bat toan bo nen
# nhung khong lan sang mau xanh la/trang cua nhan vat (chenh lech mau rat lon).

def bg_dist(px, seed):
    return sum((a - b) ** 2 for a, b in zip(px[:3], seed[:3])) ** 0.5

def remove_bg(path_in, path_out):
    im = Image.open(path_in).convert('RGBA')
    w, h = im.size
    px = im.load()
    seed = px[0, 0]
    visited = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            q.append((x, y))
    changed = 0
    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        i = y * w + x
        if visited[i]:
            continue
        visited[i] = 1
        p = px[x, y]
        if bg_dist(p, seed) <= THRESHOLD:
            px[x, y] = (p[0], p[1], p[2], 0)
            changed += 1
            q.append((x - 1, y)); q.append((x + 1, y))
            q.append((x, y - 1)); q.append((x, y + 1))
    im.save(path_out)
    return changed, w * h

if __name__ == '__main__':
    import os
    src_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(src_dir, '_bgremove_preview')
    results = []
    for n in range(1, 9):
        fn = 'sogym_mascot_%02d.png' % n
        p_in = os.path.join(src_dir, fn)
        p_out = os.path.join(out_dir, fn)
        changed, total = remove_bg(p_in, p_out)
        results.append((fn, changed, total, round(100.0 * changed / total, 1)))
    with open(os.path.join(out_dir, '_report.txt'), 'w', encoding='utf-8') as f:
        for fn, changed, total, pct in results:
            f.write('%s: %d/%d px made transparent (%.1f%%)\n' % (fn, changed, total, pct))
    print('done')
