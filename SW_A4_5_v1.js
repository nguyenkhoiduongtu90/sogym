// Service Worker cho Sổ Gym — A4.5_v1 (Image Strategy).
// Dựa trên SW.js gốc (dùng cho A4.3_v2/A4.4_v1, KHÔNG bị sửa) — thêm cache riêng cho ảnh bài tập.
// LƯU Ý: chỉ hoạt động khi trang được phục vụ qua http/https (hoặc 127.0.0.1/localhost),
// KHÔNG hoạt động khi mở trực tiếp bằng file:// — đây là giới hạn của mọi trình duyệt.

var CACHE_NAME = 'sogym-cache-v2';

// A4.5 — cache riêng cho ảnh bài tập (tách khỏi cache trang/JS/CSS ở trên), có giới hạn
// dung lượng: khi vượt quá IMAGE_CACHE_MAX_ENTRIES, tự xoá ảnh CŨ NHẤT (LRU) để nhường chỗ.
// Chỉ áp dụng cho ảnh tải từ IMG_HOST (nguồn ảnh bài tập) — không áp dụng cho trang/JS/CSS.
var IMAGE_CACHE_NAME = 'sogym-images-v1';
var IMAGE_CACHE_MAX_ENTRIES = 150;
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
