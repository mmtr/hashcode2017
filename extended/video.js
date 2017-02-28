'use strict';

class Video {
  constructor(id, size) {
    this.id = parseInt(id);
    this.size = parseInt(size);
    this._requestsFromEndpoint = {};
    this.endpoints = [];
    this.caches = [];
    this.usedCaches = [];
    this.bestCaches = [];
    this.requests = 0;
  }

  requestsFromEndpoint(endpoint) {
    if (endpoint.id in this._requestsFromEndpoint) {
      return this._requestsFromEndpoint[endpoint.id]
    } else {
      return 0;
    }
  }

  addRequests(endpoint, requests) {
    if (endpoint.id in this._requestsFromEndpoint) {
      this._requestsFromEndpoint[endpoint.id] += requests;
    } else {
      this._requestsFromEndpoint[endpoint.id] = requests;
    }
    this.requests += requests;
  }

  addEndpoint(endpoint) {
    this.endpoints.push(endpoint);
    let bestCache = endpoint.bestCache();
    if (bestCache && this.bestCaches.indexOf(bestCache) === -1) {
      this.bestCaches.push(bestCache);
    }
    endpoint.caches.forEach(cache => {
      if (cache && this.caches.indexOf(cache) === -1) {
        this.caches.push(cache);
      }
    })
  }

  cache(nth, caches) {
    /*if (!nth) {
      nth = 1;
    }

    if (!caches) {
      caches = this.bestCaches;
    }

    caches.forEach(cache => {
      if (cache.availableSize >= this.size) {
        cache.addVideo(this);
      } else {
        /*let worstVideos = cache.videosThatSaveLessTimeForSize(this.size);
        if (worstVideos.length) {
          let worstTimeSaved = 0;
          worstVideos.forEach(video => {
            worstTimeSaved += video.time;
          });
          if (this.timeSaved(cache) > worstTimeSaved) {
            // If we cache this video, we will save more time that caching the current ones already cached
            worstVideos.forEach(video => {
              cache.removeVideo(video.video)
            });
            cache.addVideo(this);
            // We try to cache again the 'bad' videos
            worstVideos.forEach(video => {
              video.video.cache();
            });
          }
        }
      }
    });

    let nextBestCaches = [];
    this.endpoints.forEach(endpoint => {
      let isServedByBestCache = this.isServedByBestCache(endpoint, nth);
      if (!isServedByBestCache) {
        // We are not caching the video in the best cache for this endpoint
        let nextBestCache = endpoint.bestCache(nth + 1);
        if (
          nextBestCache
            &&
          nextBestCaches.indexOf(nextBestCache) === -1
            &&
          this.usedCaches.indexOf(nextBestCache) === -1
        ) {
          nextBestCaches.push(nextBestCache);
        }
      }
    });
    if (nextBestCaches.length) {
      this.cache(nth + 1, nextBestCaches);
    }*/
  }

  timeSaved(cache) {
    let time = 0;
    this.endpoints.forEach(endpoint => {
      if (!this.isServedByBetterCache(endpoint, cache)) {
        time += this.requests(endpoint) * (endpoint.latency - endpoint.cacheLatency(cache));
      }
    });
  }

  isServedByBestCache(endpoint, nth) {
    let videoServedByBestCache = false;
    if (!nth) {
      nth = 1;
    }
    if (nth <= endpoint.caches.length) {
      for (let i = 1; i <= nth; i++) {
        let bestCache = endpoint.bestCache(nth);
        if (bestCache && this.usedCaches.indexOf(bestCache) !== -1) {
          videoServedByBestCache = true;
          break;
        }
      }
    }
    return videoServedByBestCache;
  }

  isServedByBetterCache(endpoint, cache) {
    let betterCacheFound = false;

    for (let i = 0; i < this.caches; i++) {
      let videoCache = this.caches[i];
      if (endpoint.caches.indexOf(videoCache) < endpoint.caches.indexOf(cache)) {
        betterCacheFound = true;
        break
      } else if (endpoint.caches.indexOf(videoCache) === endpoint.caches.indexOf(cache)) {
        betterCacheFound = true;
        break;
      }
    }

    return betterCacheFound;
  }
}

module.exports = Video;