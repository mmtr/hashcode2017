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
    this.endpoints.push(endpoint);
    endpoint.caches.forEach(cache => {
      if (cache && this.caches.indexOf(cache) === -1) {
        this.caches.push(cache);
      }
    })
  }
}

module.exports = Video;