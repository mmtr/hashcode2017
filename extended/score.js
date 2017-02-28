'use strict';

class Score {
  constructor(video, cache, stats) {
    this.video = video;
    this.cache = cache;
    this.score = this.calculateScore(stats);
  }

  calculateScore(stats) {
    // Endpoints
    let endpointsThatWillSeeTheVideo = 0;
    let endpointsThatWontSeeTheVideo = 0;
    this.cache.endpoints.forEach(endpoint => {
      if (this.video.endpoints.indexOf(endpoint) !== -1) {
        endpointsThatWillSeeTheVideo++;
      } else {
        endpointsThatWontSeeTheVideo++;
      }
    });
    let A = 0;
    if (endpointsThatWillSeeTheVideo === this.video.endpoints.length) {
      A = 1
    } else {
      A = 1 - ((endpointsThatWillSeeTheVideo - this.video.endpoints.length) / (1 - this.video.endpoints.length));
    }
    let B = 1 - (endpointsThatWontSeeTheVideo / (this.cache.endpoints.length - 1));

    // Latency
    let lowestLatency = null;
    let highestLatency = null;
    let currentLatency = null;
    this.video.caches.forEach(cache => {
      let totalLatency = 0;
      cache.endpoints.forEach(endpoint => {
        if (this.video.endpoints.indexOf(endpoint) !== -1) {
          let latency = endpoint.cacheLatency(cache);
          if (latency) {
            totalLatency += latency;
          }
          if (cache === this.cache) {
            currentLatency = totalLatency;
          }
        }
      });
      if (totalLatency) {
        if (lowestLatency) {
          lowestLatency = Math.min(lowestLatency, totalLatency);
        } else {
          lowestLatency = totalLatency;
        }
        if (highestLatency) {
          highestLatency = Math.max(highestLatency, totalLatency);
        } else {
          highestLatency = totalLatency;
        }
      }
    });
    let C = 0;
    if (lowestLatency == highestLatency) {
      C = 1;
    } else {
      C = 1 - ((currentLatency - lowestLatency) / (highestLatency - lowestLatency));
    }

    // Size
    let D = 1 - ((this.video.size - stats.minVideoSize) / (stats.maxVideoSize - stats.minVideoSize));

    // Popularity
    let E = 1 - ((this.video.requests - stats.maxVideoRequests) / (stats.minVideoRequests - stats.maxVideoRequests));

    return (20 * A) + (20 * B) + (20 * C) + (20 * D) + (20 * E);
  }
}

module.exports = Score;