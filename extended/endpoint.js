'use strict';

class Endpoint {
  constructor(id, latency, cachesConnected) {
    this.id = parseInt(id);
    this.latency = parseInt(latency);
    this.cachesConnected = parseInt(cachesConnected);
    this._cacheLatency = {};
    this.caches = [];
  }

  addCache(cache, latency) {
    this._cacheLatency[cache.id] = parseInt(latency);
    this.caches.push(cache.id);

    // Best caches first
    this.caches = this.caches.sort((cache1, cache2) => {
      return this.cacheLatency(cache2) - this.cacheLatency(cache1);
    });
  }

  cacheLatency(cache) {
    if (cache in this._cacheLatency) {
      return this._cacheLatency[cache.id];
    } else {
      return null;
    }
  }

  /*bestCache(nth) {
    if (!nth) {
      nth = 1;
    }

    return this.caches.length && nth <= this.caches.length ? this.caches[nth-1] : null;
  }*/

}

module.exports = Endpoint;