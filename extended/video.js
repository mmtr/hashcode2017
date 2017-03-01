'use strict';

class Video {
  constructor(id, size) {
    this.id = parseInt(id);
    this.size = parseInt(size);
    this.endpoints = [];
    this.caches = [];
    this.usedCaches = [];
    this.requests = 0;
  }

  addRequests(requests) {
    this.requests += requests;
  }

  addEndpoint(endpoint) {
    this.endpoints.push(endpoint.id);
    endpoint.caches.forEach(cacheId => {
      if (cacheId && this.caches.indexOf(cacheId) === -1) {
        this.caches.push(cacheId);
      }
    })
  }
}

module.exports = Video;