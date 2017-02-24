'use strict';

const fs = require('fs');
const readline = require('readline');

class Config {
  constructor(videos, endpoints, requests, caches, cacheSize) {
    this.videos = parseInt(videos);
    this.endpoints = parseInt(endpoints);
    this.requests = parseInt(requests);
    this.caches = parseInt(caches);
    this.cacheSize = parseInt(cacheSize);
  }
}

class Video {
  constructor(id, size) {
    this.id = parseInt(id);
    this.size = parseInt(size);
    this.cached = false;
    this.popularity = 0;
  }
}

class Cache {
  constructor(id, size) {
    this.id = parseInt(id);
    this.size = parseInt(size);
    this.used = 0;
    this.videos = [];
  }

  addVideo(video) {
    this.videos.push(video);
    this.used += video.size;
    video.cached = true;
  }

  get availableSize() {
    return this.size - this.used;
  }
}

class CacheConnection {
  constructor(cacheId, endpointId, latency) {
    this.cacheId = parseInt(cacheId);
    this.endpointId = parseInt(endpointId);
    this.latency = parseInt(latency);
  }
}

class Endpoint {
  constructor(id, latency, cachesConnected) {
    this.id = parseInt(id);
    this.latency = parseInt(latency);
    this.cachesConnected = parseInt(cachesConnected);
    this.cacheConnections = [];
  }
}

class RequestDescriptions {
  constructor(videoId, endpointId, requests) {
    this.videoId = parseInt(videoId);
    this.endpointId = parseInt(endpointId);
    this.requests = parseInt(requests);
  }
}

class YouTube {
  constructor(config, videos, endpoints, requestDescriptions, caches) {
    this.config = config;
    this.videos = videos;
    this.endpoints = endpoints;
    this.requestDescriptions = requestDescriptions;
    this.caches = caches;
  }

  cacheVideos() {

    /*let requestDescriptions = this.requestDescriptions.sort((requestDescription1, requestDescription2) => {
      var video1 = this.videos.find(video => {
        return video.id === requestDescription1.videoId;
      });
      var video2 = this.videos.find(video => {
        return video.id === requestDescription2.videoId;
      });
      return video1.size - video2.size;
    });*/

    let requestDescriptions = this.requestDescriptions.sort((requestDescription1, requestDescription2) => {
      return requestDescription2.requests - requestDescription1.requests;
    });

    requestDescriptions.forEach(requestDescription => {
      var endpoint = this.endpoints.find(endpoint => {
        return endpoint.id === requestDescription.endpointId;
      });
      var video = this.videos.find(video => {
        return video.id === requestDescription.videoId && !video.cached;
      });
      if (video) {
        let caches = [];
        endpoint.cacheConnections.forEach(cacheConnection => {
          let cache = this.caches.find(cache => {
            return cache.id === cacheConnection.cacheId && cache.availableSize >= video.size;
          });
          if (cache) {
            caches.push(cache);
          }
        });
        if (caches.length) {
          let timeSaved = [];
          caches.forEach(cache => {
            let cacheConnection = endpoint.cacheConnections.find(cacheConnection => {
              return cacheConnection.cacheId === cache.id
            });
            timeSaved.push({
              cache: cache,
              time: requestDescription.requests * (endpoint.latency - cacheConnection.latency)
            })
          });
          timeSaved.sort((cache1, cache2) => {
            return cache2.time - cache1.time;
          });
          let cache = timeSaved[0].cache;
          cache.addVideo(video);
        }
      }
    });
  }
}

//const files = ['me_at_the_zoo'];
const files = ['me_at_the_zoo', 'kittens', 'trending_today', 'videos_worth_spreading'];

files.forEach(file => processFile(file));

function processFile(filename) {
  var startTime = new Date();
  console.log(filename + ': start', new Date() - startTime);
  if (fs.existsSync(filename + '.out')) {
    fs.unlinkSync(filename + '.out');
  }
  const input = fs.createReadStream(filename + '.in');
  const output = fs.createWriteStream(filename + '.out');

  const rl = readline.createInterface({
    input: input
  });

  let youtube = null;
  let config = null;
  let videos = [];
  let endpoints = [];
  let requestDescriptions = [];
  let caches = [];

  console.log(filename + ': reading file...', new Date() - startTime);

  rl.on('line', line => {
    line = line.split(' ');
    if (!config) {
      const V = line[0];
      const E = line[1];
      const R = line[2];
      const C = line[3];
      const X = line[4];
      config = new Config(V, E, R, C, X);
    } else if (videos.length !== config.videos) {
      line.forEach((videoSize, videoId) => {
        let video = new Video(videoId, videoSize);
        videos.push(video);
      });
    } else if (endpoints.length !== config.endpoints || endpoints[endpoints.length - 1].cachesConnected !== endpoints[endpoints.length - 1].cacheConnections.length) {
      if (endpoints.length) {
        let lastEnpoint = endpoints[endpoints.length - 1];
        if (lastEnpoint.cachesConnected !== lastEnpoint.cacheConnections.length) {
          let cacheConnection = new CacheConnection(line[0], lastEnpoint.id, line[1]);
          lastEnpoint.cacheConnections.push(cacheConnection);

          let newCache = new Cache(cacheConnection.cacheId, config.cacheSize);
          let existingCache = caches.find(cache => {
            return cache.id === newCache.id
          });
          if (!existingCache) {
            caches.push(newCache);
          }
        } else {
          let endpoint = new Endpoint(endpoints.length, line[0], line[1]);
          endpoints.push(endpoint)
        }
      } else {
        let endpoint = new Endpoint(endpoints.length, line[0], line[1]);
        endpoints.push(endpoint)
      }
    } else if (requestDescriptions.length !== config.requests) {
      let requestDescription = new RequestDescriptions(line[0], line[1], line[2]);
      requestDescriptions.push(requestDescription)
    }
  });

  rl.on('close', () => {
    youtube = new YouTube(config, videos, endpoints, requestDescriptions, caches);

    console.log(filename + ': caching videos...', new Date() - startTime);
    youtube.cacheVideos();

    console.log(filename + ': writing file...', new Date() - startTime);

    output.write(youtube.caches.length + '\n');
    youtube.caches.forEach(cache => {
      if (cache.videos.length) {
        let lineToWrite = cache.id;
        cache.videos.forEach(video => {
          lineToWrite += (' ' + video.id);
        });
        output.write(lineToWrite + '\n');
      }
    });
    console.log(filename + ': end', new Date() - startTime);
  });
}
