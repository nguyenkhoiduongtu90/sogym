// Service Worker cho Sổ Gym — A7_v2 (tăng giới hạn cache ảnh bài tập).
// Dựa trên SW_A7_v1.js (Cross-origin GET bypass cache, dựa trên SW_A4_5_v1.js — KHÔNG bị sửa,
// giữ nguyên cho các bản đã confirm OK trước đó: A4.5_v9/A6_v1/A6_v2). Chỉ 1 thay đổi so với
// SW_A7_v1.js: IMAGE_CACHE_MAX_ENTRIES tăng 150 → 400 (xem lý do ở dòng khai báo bên dưới) —
// không đổi logic/thuật toán LRU, không đổi nhánh cross-origin bypass của A7_v1.
// LƯU Ý: chỉ hoạt động khi trang được phục vụ qua http/https (hoặc 127.0.0.1/localhost),
// KHÔNG hoạt động khi mở trực tiếp bằng file:// — đây là giới hạn của mọi trình duyệt.

// A7_v1 — CACHE_NAME bump lên v3 (từ v2) để activate() tự xoá sạch cache 'sogym-cache-v2' cũ,
// vì cache đó có thể đang chứa 1 response GET tới Google Sheets API bị cache nhầm từ trước khi
// sửa (SW cũ áp dụng cache-first cho MỌI GET không phân biệt nguồn) — không dọn thì response cũ
// vẫn nằm im trong cache store đó dù logic fetch mới không còn đọc/ghi vào nó cho các URL đó nữa.
var CACHE_NAME = 'sogym-cache-v3';

// A4.5 — cache riêng cho ảnh bài tập (tách khỏi cache trang/JS/CSS ở trên), có giới hạn
// dung lượng: khi vượt quá IMAGE_CACHE_MAX_ENTRIES, tự xoá ảnh CŨ NHẤT (LRU) để nhường chỗ.
// Chỉ áp dụng cho ảnh tải từ IMG_HOST (nguồn ảnh bài tập) — không áp dụng cho trang/JS/CSS.
// A7_v2: tăng 150 → 400 — user báo thực tế lướt qua nhiều hơn 150 bài/phiên thì ảnh cũ hơn
// bị LRU xoá sớm hơn mong đợi, phải tải lại khi offline. 400 ảnh JPG thumbnail cỡ nhỏ vẫn ở
// mức dung lượng chấp nhận được trên điện thoại (không đổi thuật toán trim/touch bên dưới).
var IMAGE_CACHE_NAME = 'sogym-images-v1';
var IMAGE_CACHE_MAX_ENTRIES = 400;
var IMG_HOST = 'raw.githubusercontent.com';

self.addEventListener('install', function(event){
  self.skipWaiting();
  // Không cache trước 1 tên file cố định (không biết chắc bạn đặt tên file HTML là gì) —
  // cache sẽ tự lấp đầy qua runtime caching thật bên dưới, có waitUntil bảo vệ đầy đủ.
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME && k !== IMAGE_CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Xoá bớt ảnh cũ nhất trong IMAGE_CACHE_NAME nếu vượt quá giới hạn số lượng.
// caches.keys()/cache.keys() trả về theo thứ tự chèn vào — mục đầu tiên là cũ nhất
// (miễn là mỗi lần "chạm" lại 1 ảnh đã có, ta xoá rồi put lại để đẩy nó xuống cuối danh sách —
// xem hàm touchImageCacheEntry bên dưới). Đây là cách làm LRU đơn giản, không cần thêm
// IndexedDB/bảng theo dõi riêng.
function trimImageCache(cache){
  return cache.keys().then(function(keys){
    if(keys.length <= IMAGE_CACHE_MAX_ENTRIES) return;
    var excess = keys.length - IMAGE_CACHE_MAX_ENTRIES;
    var toDelete = keys.slice(0, excess);
    return Promise.all(toDelete.map(function(k){ return cache.delete(k); }));
  });
}

// "Chạm" lại 1 entry đã có trong cache ảnh để đánh dấu nó vừa được dùng gần đây nhất
// (xoá rồi put lại cùng response — cache.keys() sẽ trả nó ở cuối danh sách sau thao tác này).
function touchImageCacheEntry(cache, req, res){
  return cache.delete(req).then(function(){ return cache.put(req, res); });
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var isNavigation = req.mode === 'navigate';

  // A7_v1: xác định request có CÙNG GỐC (origin) với chính app hay không — dùng để loại các
  // request đi ra ngoài (Google Sheets API, Google Identity script, v.v.) khỏi cache-first bên
  // dưới. So sánh cả origin (scheme+host+port), không chỉ hostname, cho chắc chắn.
  var reqOrigin = '';
  try{ reqOrigin = new URL(req.url).origin; }catch(e){ reqOrigin = ''; }
  var isSameOrigin = reqOrigin === self.location.origin;

  if(isNavigation){
    event.respondWith((async function(){
      try{
        var res = await fetch(req);
        var cache = await caches.open(CACHE_NAME);
        await cache.put(req, res.clone()); // ĐƯỢC waitUntil bảo vệ (nằm trong chuỗi respondWith) — không còn bị cắt ngang
        return res;
      }catch(networkErr){
        var cache = await caches.open(CACHE_NAME);
        var cached = await cache.match(req);
        if(cached) return cached;
        var allKeys = await cache.keys();
        var anyHtml = allKeys.find(function(k){ return k.url.endsWith('.html'); });
        if(anyHtml) return cache.match(anyHtml);
        return new Response(
          'Không có mạng và chưa có bản lưu ngoại tuyến cho trang này. Hãy mở app 1 lần khi có mạng trước.',
          {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}}
        );
      }
    })());
    return;
  }

  var isImageRequest = false;
  try{ isImageRequest = new URL(req.url).hostname === IMG_HOST; }catch(e){ isImageRequest = false; }

  if(isImageRequest){
    event.respondWith((async function(){
      var cache = await caches.open(IMAGE_CACHE_NAME);
      var cached = await cache.match(req);
      if(cached){
        event.waitUntil(touchImageCacheEntry(cache, req, cached.clone()));
        return cached;
      }
      try{
        var res = await fetch(req);
        if(res && (res.status === 200 || res.type === 'opaque')){
          await cache.put(req, res.clone());
          event.waitUntil(trimImageCache(cache));
        }
        return res;
      }catch(e){
        // Chưa từng cache ảnh này và hiện không có mạng/bị chặn — để trình duyệt tự bắn
        // sự kiện lỗi trên thẻ <img>, onerror trong thumbHTML() sẽ hiện emoji 🏋 dự phòng.
        return new Response('', {status: 408, statusText: 'Offline, chưa có cache cho ảnh này'});
      }
    })());
    return;
  }

  // A7_v1 — FIX: request GET đi tới nguồn KHÁC GỐC (vd sheets.googleapis.com khi Sao lưu/Khôi
  // phục Google Sheets, accounts.google.com khi tải script đăng nhập) không được cache-first như
  // nhánh chung bên dưới nữa — luôn đi thẳng ra mạng, không đọc/ghi cache. Trước bản vá này, nhánh
  // cache-chung áp dụng cho MỌI GET không phân biệt nguồn, khiến lần gọi "Khôi phục từ Google
  // Sheets" đầu tiên bị Service Worker cache lại vĩnh viễn — mọi lần "Khôi phục" sau đó (dù Sheet
  // đã có thêm dòng mới) đều trả về đúng bản CŨ NHẤT đã cache lần đầu, không bao giờ thấy dữ liệu
  // mới. Tài nguyên CÙNG GỐC (JS/CSS/HTML/ảnh không thuộc IMG_HOST của chính app) vẫn cache-first
  // như thiết kế ban đầu — không đổi.
  if(!isSameOrigin){
    event.respondWith(fetch(req));
    return;
  }

  event.respondWith((async function(){
    var cache = await caches.open(CACHE_NAME);
    var cached = await cache.match(req);
    if(cached) return cached;
    try{
      var res = await fetch(req);
      if(res && (res.status === 200 || res.type === 'opaque')){
        await cache.put(req, res.clone());
      }
      return res;
    }catch(e){
      return new Response('', {status: 408, statusText: 'Offline, chưa có cache cho tài nguyên này'});
    }
  })());
});
