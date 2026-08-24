// Service Worker cho Sổ Gym — A_Final_WIP (Final Audit Batch 3, Fix 3.4).
// Dựa trên SW_A7_v2.js (KHÔNG bị sửa, giữ nguyên cho các bản đã confirm OK trước đó:
// A4.5_v9/A6_v1/A6_v2/A7_v1/A7_v2) — 3 thay đổi so với SW_A7_v2.js, tất cả đều tái dùng
// đúng thuật toán LRU (insertion-order trim + touch-on-hit) đã có sẵn cho cache ảnh bài tập,
// không phát minh cơ chế mới:
//   1) Cache chung same-origin (CACHE_NAME) trước đây KHÔNG có giới hạn/trim → nay có, giống
//      cache ảnh bài tập (xem GENERAL_CACHE_MAX_ENTRIES + trimCache/touchCacheEntry dùng chung).
//   2) Thêm bucket cache RIÊNG cho ảnh splash/mascot same-origin (pics/resized/*.png — xem
//      Fix 3.1 ở file HTML: 7/8 mascot đổi từ base64 inline sang file ảnh thật) — tách khỏi
//      CACHE_NAME để không tranh chỗ LRU với file lõi (HTML/JS chính của app).
//   3) KHÔNG còn cần allowlist domain CDN nào cho SheetJS nữa — thư viện xuất Excel đã được
//      self-host same-origin (Fix 3.2 ở file HTML: ./xlsx.full.min.js), tự động đi qua nhánh
//      cache-chung same-origin bên dưới như mọi tài nguyên nội bộ khác, không cần xử lý riêng.
// Nhánh cross-origin bypass (Google Sheets API, Google Identity) GIỮ NGUYÊN như A7_v1/A7_v2 —
// không đổi, vẫn cần thiết vì các endpoint đó trả dữ liệu động.
// LƯU Ý: chỉ hoạt động khi trang được phục vụ qua http/https (hoặc 127.0.0.1/localhost),
// KHÔNG hoạt động khi mở trực tiếp bằng file:// — đây là giới hạn của mọi trình duyệt.

// Batch 3 — CACHE_NAME bump lên v4 (từ v3) để activate() tự xoá sạch cache 'sogym-cache-v3' cũ,
// vốn đã phình to không giới hạn qua nhiều đời file HTML trước đây (không có trim) — dọn sạch 1
// lần cho gọn, đúng tiền lệ đã ghi chú sẵn trong SW_A7_v2.js cho lần bump v2→v3 trước đó.
var CACHE_NAME = 'sogym-cache-v4';
// Số entry tối đa cho cache chung (HTML + xlsx.full.min.js self-host + các tài nguyên same-origin
// khác nếu có về sau). App hiện chỉ có rất ít URL same-origin cố định (1 HTML + 1 JS thư viện),
// 30 là dư dả để không bao giờ trim nhầm trong vận hành bình thường, chỉ có tác dụng chặn phình vô
// hạn khi tên file HTML đổi qua nhiều đời version dev.
var GENERAL_CACHE_MAX_ENTRIES = 30;

// A4.5 — cache riêng cho ảnh bài tập (tách khỏi cache trang/JS/CSS ở trên), có giới hạn dung
// lượng: khi vượt quá IMAGE_CACHE_MAX_ENTRIES, tự xoá ảnh CŨ NHẤT (LRU) để nhường chỗ. Chỉ áp
// dụng cho ảnh tải từ IMG_HOST (nguồn ảnh bài tập) — không áp dụng cho trang/JS/CSS. Không đổi
// so với SW_A7_v2.js (giữ nguyên 400, lý do xem A7_v2).
var IMAGE_CACHE_NAME = 'sogym-images-v1';
var IMAGE_CACHE_MAX_ENTRIES = 400;
var IMG_HOST = 'raw.githubusercontent.com';

// Batch 3 (Fix 3.4) — bucket cache RIÊNG cho ảnh splash/mascot same-origin (pics/resized/*.png).
// Chỉ có đúng 7 file cố định (mascot_02..08 — mascot_01 vẫn nhúng base64 tĩnh trong HTML, không
// qua đây), giới hạn 10 (dư 3 chỗ) chỉ mang tính phòng hờ, không kỳ vọng bao giờ chạm ngưỡng trim
// trong vận hành bình thường.
var SPLASH_CACHE_NAME = 'sogym-splash-v1';
var SPLASH_CACHE_MAX_ENTRIES = 10;
var SPLASH_PATH_PART = '/pics/';

self.addEventListener('install', function(event){
  self.skipWaiting();
  // Không cache trước 1 tên file cố định (không biết chắc bạn đặt tên file HTML là gì) —
  // cache sẽ tự lấp đầy qua runtime caching thật bên dưới, có waitUntil bảo vệ đầy đủ.
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){
        return k !== CACHE_NAME && k !== IMAGE_CACHE_NAME && k !== SPLASH_CACHE_NAME;
      }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Batch 3 (Fix 3.4) — TỔNG QUÁT HOÁ 2 hàm trim/touch của SW_A7_v2.js (trước đây viết cứng riêng
// cho cache ảnh bài tập: trimImageCache/touchImageCacheEntry) thành 2 hàm dùng chung, nhận cache
// + maxEntries làm tham số, để tái dùng cho CẢ 3 cache store (ảnh bài tập, ảnh splash, cache
// chung) — không đổi thuật toán, chỉ hết trùng lặp code. cache.keys() vẫn trả theo thứ tự chèn —
// mục đầu tiên là cũ nhất (miễn là mỗi lần "chạm" lại 1 entry đã có, ta xoá rồi put lại để đẩy nó
// xuống cuối danh sách — xem touchCacheEntry bên dưới). Vẫn là LRU đơn giản, không cần thêm
// IndexedDB/bảng theo dõi riêng — giữ nguyên triết lý của A7_v2.
function trimCache(cache, maxEntries){
  return cache.keys().then(function(keys){
    if(keys.length <= maxEntries) return;
    var excess = keys.length - maxEntries;
    var toDelete = keys.slice(0, excess);
    return Promise.all(toDelete.map(function(k){ return cache.delete(k); }));
  });
}
function touchCacheEntry(cache, req, res){
  return cache.delete(req).then(function(){ return cache.put(req, res); });
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var isNavigation = req.mode === 'navigate';

  // Xác định request có CÙNG GỐC (origin) với chính app hay không — dùng để loại các request đi
  // ra ngoài (Google Sheets API, Google Identity script, v.v.) khỏi cache-first bên dưới. So sánh
  // cả origin (scheme+host+port), không chỉ hostname, cho chắc chắn. Không đổi so với A7_v2.
  var reqOrigin = '';
  try{ reqOrigin = new URL(req.url).origin; }catch(e){ reqOrigin = ''; }
  var isSameOrigin = reqOrigin === self.location.origin;

  if(isNavigation){
    event.respondWith((async function(){
      try{
        var res = await fetch(req);
        var cache = await caches.open(CACHE_NAME);
        await cache.put(req, res.clone()); // ĐƯỢC waitUntil bảo vệ (nằm trong chuỗi respondWith)
        // Batch 3 (Fix 3.4): trim ngay sau khi ghi — đây chính là nguồn phình cache chính (mỗi
        // bản HTML đổi tên qua các đời version dev cộng dồn lại vĩnh viễn nếu không trim).
        event.waitUntil(trimCache(cache, GENERAL_CACHE_MAX_ENTRIES));
        return res;
      }catch(networkErr){
        var cache = await caches.open(CACHE_NAME);
        var cached = await cache.match(req);
        if(cached){
          // Batch 3 (Fix 3.4): touch-on-hit — trang đang được dùng offline vẫn được "chạm" lại
          // để không bị trim nhầm là cũ nhất trong khi vẫn đang là bản đang dùng thật sự.
          event.waitUntil(touchCacheEntry(cache, req, cached.clone()));
          return cached;
        }
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
        event.waitUntil(touchCacheEntry(cache, req, cached.clone()));
        return cached;
      }
      try{
        var res = await fetch(req);
        if(res && (res.status === 200 || res.type === 'opaque')){
          await cache.put(req, res.clone());
          event.waitUntil(trimCache(cache, IMAGE_CACHE_MAX_ENTRIES));
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

  // Batch 3 (Fix 3.4) — ảnh splash/mascot: same-origin, path chứa '/pics/' (xem Fix 3.1 ở file
  // HTML — 7/8 mascot đổi từ base64 inline sang file ảnh thật tại pics/resized/*.png). Đi riêng
  // vào SPLASH_CACHE_NAME, KHÔNG dùng chung CACHE_NAME với file lõi, để tránh 2 loại tài nguyên có
  // tần suất/độ ưu tiên khác nhau tranh chỗ trong cùng 1 danh sách LRU.
  var isSplashRequest = false;
  if(isSameOrigin){
    try{ isSplashRequest = new URL(req.url).pathname.indexOf(SPLASH_PATH_PART) !== -1; }catch(e){ isSplashRequest = false; }
  }

  if(isSplashRequest){
    event.respondWith((async function(){
      var cache = await caches.open(SPLASH_CACHE_NAME);
      var cached = await cache.match(req);
      if(cached){
        event.waitUntil(touchCacheEntry(cache, req, cached.clone()));
        return cached;
      }
      try{
        var res = await fetch(req);
        if(res && (res.status === 200 || res.type === 'opaque')){
          await cache.put(req, res.clone());
          event.waitUntil(trimCache(cache, SPLASH_CACHE_MAX_ENTRIES));
        }
        return res;
      }catch(e){
        // Chưa từng cache ảnh mascot này và hiện không có mạng — el.src lỗi tải, trình duyệt tự
        // bắn sự kiện 'error' trên thẻ <img id="splashIcon">, không có onerror riêng cho splash
        // nên ảnh chỉ đơn giản không đổi (giữ nguyên mascot_01 mặc định đã nhúng sẵn), không crash.
        return new Response('', {status: 408, statusText: 'Offline, chưa có cache cho ảnh mascot này'});
      }
    })());
    return;
  }

  // Request GET đi tới nguồn KHÁC GỐC (vd sheets.googleapis.com khi Sao lưu/Khôi phục Google
  // Sheets, accounts.google.com khi tải script đăng nhập) không được cache-first như nhánh chung
  // bên dưới — luôn đi thẳng ra mạng, không đọc/ghi cache. Không đổi so với A7_v1/A7_v2. SheetJS
  // không còn rơi vào nhánh này nữa (đã self-host same-origin — xem Fix 3.2 ở file HTML).
  if(!isSameOrigin){
    event.respondWith(fetch(req));
    return;
  }

  event.respondWith((async function(){
    var cache = await caches.open(CACHE_NAME);
    var cached = await cache.match(req);
    if(cached){
      // Batch 3 (Fix 3.4): touch-on-hit cho cache chung — trước đây A7_v2 chỉ ghi (put) mà không
      // "chạm" lại khi trúng cache, nên trim theo thứ tự chèn có thể xoá nhầm 1 tài nguyên đang
      // được dùng thường xuyên nhưng ít khi bị ghi lại (vd xlsx.full.min.js — chỉ ghi 1 lần lúc
      // tải đầu, nhưng có thể được match/dùng lại nhiều lần sau đó qua registration cache của
      // trình duyệt trước khi chạm SW — trường hợp SW match trực tiếp thì touch đảm bảo đúng nghĩa
      // LRU theo lần dùng gần nhất, không chỉ theo lần ghi gần nhất).
      event.waitUntil(touchCacheEntry(cache, req, cached.clone()));
      return cached;
    }
    try{
      var res = await fetch(req);
      if(res && (res.status === 200 || res.type === 'opaque')){
        await cache.put(req, res.clone());
        event.waitUntil(trimCache(cache, GENERAL_CACHE_MAX_ENTRIES));
      }
      return res;
    }catch(e){
      return new Response('', {status: 408, statusText: 'Offline, chưa có cache cho tài nguyên này'});
    }
  })());
});
