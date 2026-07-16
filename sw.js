// sw.js — 七天練習 離線快取
// 版本號：改內容時記得更新 CACHE_NAME,舊快取才會被清掉
const CACHE_NAME = 'sy7-cache-v1';

const CORE_ASSETS = [
  './index.html',
  './day.html',
  './days.json',
  './manifest.json'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// 策略：先查快取,沒有才去網路抓（適合內容不常變動的練習頁面）
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        // 動態快取新抓到的資源（例如音檔、圖片）,方便下次離線使用
        if(response && response.status === 200 && response.type === 'basic'){
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function(){
        // 網路也失敗、快取也沒有時,對HTML請求給個離線提示
        if(event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')){
          return caches.match('./index.html');
        }
      });
    })
  );
});
