'use strict';

class Score {
  constructor(video, cache, caches, stats, endpoints) {
    this.video = video;
    this.cache = cache;
    this.score = this.calculateScore(caches, stats, endpoints);
  }

  calculateScore(caches, stats, endpoints) {
    // Endpoints
    let endpointsThatWillSeeTheVideo = 0;
    let endpointsThatWontSeeTheVideo = 0;
    this.cache.endpoints.forEach(endpointId => {
      if (this.video.endpoints.indexOf(endpointId) !== -1) {
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
    let B = 0;
    if (this.cache.endpoints.length === 1) {
      B = 1
    } else {
      B = 1 - (endpointsThatWontSeeTheVideo / (this.cache.endpoints.length - 1));
    }

    // Latency
    let lowestLatency = null;
    let highestLatency = null;
    let currentLatency = null;
    this.video.caches.forEach(cacheId => {
      let cache = caches[cacheId];
      let totalLatency = 0;
      cache.endpoints.forEach(endpointId => {
        let endpoint = endpoints[endpointId];
        if (this.video.endpoints.indexOf(endpoint.id) !== -1) {
          let latency = null;
          if (cache.id in endpoint._cacheLatency) {
            latency = endpoint._cacheLatency[cache.id];
          }
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

    let score = (20 * A) + (20 * B) + (20 * C) + (20 * D) + (20 * E);
    return score;
  }
}

module.exports = Score;