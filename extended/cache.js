'use strict';

class Cache {
  constructor(id, size) {
    this.id = parseInt(id);
    this.size = parseInt(size);
    this.used = 0;
    this.videos = [];
    this.timeSavedPerVideo = [];
    this.endpoints = [];
    this._endpointLatency = {};
  }

  get availableSize() {
    return this.size - this.used;
  }

  addVideo(video) {
    if (this.videos.indexOf(video) === -1) {
      this.videos.push(video);
      this.used += video.size;

      video.usedCaches.push(this);
    }
  }

  removeVideo(video) {
    const videoIndex = this.videos.indexOf(video);
    this.videos.splice(videoIndex, 1);
    this.used -= video.size;

    const usedCacheIndex = video.usedCaches.indexOf(this);
    video.usedCaches.splice(usedCacheIndex, 1);
  }

  videosThatSaveLessTimeForSize(size) {
    let worstVideos = [];
    this.updateTimeSavedPerVideo();


    if (size <= this.size) {
      let totalSize = 0;
      let index = 0;

      while (totalSize < size) {
        let video = this.timeSavedPerVideo[index];
        worstVideos.push(video);
        totalSize += video.video.size;
        index++;
      }
    }
    return worstVideos;
  }

  updateTimeSavedPerVideo() {
    this.timeSavedPerVideo = [];

    this.videos.forEach(video => {
      this.timeSavedPerVideo.push({
        video: video,
        time: video.timeSaved(this),
      })
    });

    this.timeSavedPerVideo = this.timeSavedPerVideo.sort((timeSavedPerVideo1, timeSavedPerVideo2) => {
      return timeSavedPerVideo1.time - timeSavedPerVideo2.time;
    });
  }

  addEndpoint(endpoint, latency) {
    this.endpoints.push(endpoint);
    this._endpointLatency[endpoint.id] = parseInt(latency);
  }

  endpointLatency(endpoint) {
    if (endpoint.id in this._endpointLatency) {
      return this._endpointLatency[endpoint.id];
    } else {
      return null;
    }
  }
}

module.exports = Cache;