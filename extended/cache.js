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

  addVideo(video) {
    if (this.availableSize >= video.size) {
      if (this.videos.indexOf(video) === -1) {
        if (this.willServeVideo(video)) {
          this.videos.push(video);
          this.used += video.size;

          video.usedCaches.push(this);
        }
      }
    }
  }

  addEndpoint(endpoint) {
    this.endpoints.push(endpoint);
  }

  willServeVideo(video) {
    // Video will be served from this cache if it contains at least one endpoint not connected to a used cache in the
    // video

    let willServeVideo = false;

    let endpoints = [];
    video.usedCaches.forEach(cache => {
      cache.endpoints.forEach(endpoint => {
        if (endpoints.indexOf(endpoint) === -1) {
          endpoints.push(endpoint);
        }
      });
    });

    for (let i = 0; i < this.endpoints.length; i++) {
      let endpoint = this.endpoints[i];
      if (endpoints.indexOf(endpoint) === -1) {
        willServeVideo = true;
        break;
      }
    }

    return willServeVideo;
  }
}

module.exports = Cache;