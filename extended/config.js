'use strict';

class Config {
  constructor(videos, endpoints, requestDescriptions, caches, cacheSize) {
    this.videos = parseInt(videos);
    this.endpoints = parseInt(endpoints);
    this.requestDescriptions = parseInt(requestDescriptions);
    this.caches = parseInt(caches);
    this.cacheSize = parseInt(cacheSize);
  }
}

module.exports = Config;