'use strict';

class Cache {
  constructor(id, size) {
    this.id = parseInt(id);
    this.size = parseInt(size);
    this.used = 0;
    this.videos = [];
    //this.timeSavedPerVideo = [];
    this.endpoints = [];
    //this._endpointLatency = {};
  }

  get availableSize() {
    return this.size - this.used;
  }

  addVideo(video, youtube) {
    if (this.availableSize >= video.size) {
      if (this.videos.indexOf(video.id) === -1) {
        if (this.willServeVideo(video, youtube)) {
          this.videos.push(video.id);
          this.used += video.size;

          video.usedCaches.push(this.id);
        }
      }
    }
  }

  addEndpoint(endpoint) {
    this.endpoints.push(endpoint.id);
  }

  willServeVideo(video, youtube) {
    // Video will be served from this cache if it contains at least one endpoint not connected to a used cache in the
    // video

    let willServeVideo = false;

    let endpoints = [];
    video.usedCaches.forEach(cacheId => {
      let cache = youtube.caches[cacheId];
      cache.endpoints.forEach(endpointId => {
        if (endpoints.indexOf(endpointId) === -1) {
          endpoints.push(endpointId);
        }
      });
    });

    for (let endpointId in this.endpoints) {
      if (endpoints.indexOf(parseInt(endpointId)) === -1) {
        willServeVideo = true;
        break;
      }
    }

    return willServeVideo;
  }
}

module.exports = Cache;