// Service Worker cho Sổ Gym — cho phép app mở lại được khi không có Internet.
// LƯU Ý: chỉ hoạt động khi trang được phục vụ qua http/https (hoặc 127.0.0.1/localhost),
// KHÔNG hoạt động khi mở trực tiếp bằng file:// — đây là giới hạn của mọi trình duyệt.

var CACHE_NAME = 'sogym-cache-v2';

self.addEventListener('install', function(event){
  self.skipWaiting();
  // Không cache trước 1 tên file cố định (không biết chắc bạn đặt tên file HTML là gì) —
  // cache sẽ tự lấp đầy qua runtime caching thật bên dưới, có waitUntil bảo vệ đầy đủ.
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

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
