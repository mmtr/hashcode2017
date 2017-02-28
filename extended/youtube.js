'use strict';

const fs = require('fs');
const readline = require('readline');
const EventEmitter = require('events');

const Config = require('./config');
const Video = require('./video');
const Cache = require('./cache');
const Endpoint = require('./endpoint');
const Score = require('./score');

class YouTube extends EventEmitter {
  constructor(filename) {
    super();
    this.startTime = new Date();
    this.filename = filename;
    this.config = null;
    this.videos = [];
    this.endpoints = [];
    this.caches = [];
    this.stats = {
      videos: 0,
      endpoints: 0,
      caches: 0,
      minVideoSize: null,
      maxVideoSize: null,
      minVideoRequests: null,
      maxVideoRequests: null,
    };
    this.scores = [];
  }

  start() {
    console.log(this.filename + ': start', new Date() - this.startTime);

    const rl = this.readFile();

    rl.on('close', () => {
      this.calculateScore();
      this.cacheVideos();
      this.writeFile();
      console.log(this.filename + ': end', new Date() - this.startTime);
      this.emit('end');
    });
  }

  readFile() {
    console.log(this.filename + ': reading file...', new Date() - this.startTime);

    const input = fs.createReadStream(this.filename + '.in');

    const rl = readline.createInterface({
      input: input
    });

    rl.on('line', line => {
      line = line.split(' ');
      if (!this.config) {
        this.parseConfig(line);
      } else if (this.stats.videos !== this.config.videos) {
        this.parseVideos(line);
      } else if (
          this.stats.endpoints !== this.config.endpoints
            ||
          this.lastEndpoint.cachesConnected !== this.lastEndpoint.caches.length
      ) {
        this.parseEndpoints(line)
      } else {
        this.parseRequestDescriptions(line);
      }
    });

    return rl;
  }

  parseConfig(line) {
    const V = line[0];
    const E = line[1];
    const R = line[2];
    const C = line[3];
    const X = line[4];
    this.config = new Config(V, E, R, C, X);
  }

  parseVideos(line) {
    line.forEach((videoSize, videoId) => {
      let video = new Video(videoId, videoSize);
      this.videos.push(video);
      this.stats.videos++;
      if (!this.stats.minVideoSize) {
        this.stats.minVideoSize = video.size;
      } else {
        this.stats.minVideoSize = Math.min(video.size, this.stats.minVideoSize);
      }
      if (!this.stats.maxVideoSize) {
        this.stats.maxVideoSize = video.size;
      } else {
        this.stats.maxVideoSize = Math.max(video.size, this.stats.maxVideoSize);
      }
    });
  }

  get lastEndpoint() {
    return this.endpoints[this.endpoints.length - 1];
  }

  parseEndpoints(line) {
    if (this.endpoints.length) {
      if (this.lastEndpoint.cachesConnected !== this.lastEndpoint.caches.length) {
        this.parseCacheConnection(line);
      } else {
        this.parseEndpoint(line);
      }
    } else {
      this.parseEndpoint(line);
    }
  }

  parseEndpoint(line) {
    let endpoint = new Endpoint(this.endpoints.length, line[0], line[1]);
    this.endpoints.push(endpoint);
    this.stats.endpoints++;
  }

  parseCacheConnection(line) {
    let cacheId = line[0];
    let cache = this.caches.find(cache => {
      return cache.id === parseInt(cacheId);
    });
    if (!cache) {
      cache = new Cache(line[0], this.config.cacheSize);
      this.caches.push(cache);
      this.stats.caches++;
    }
    this.lastEndpoint.addCache(cache, line[1]);
    cache.addEndpoint(this.lastEndpoint, line[1]);
  }

  parseRequestDescriptions(line) {
    let video = this.videos.find(video => {
      return video.id === parseInt(line[0]);
    });
    let endpoint = this.endpoints.find(endpoint => {
      return endpoint.id === parseInt(line[1]);
    });
    let requests = parseInt(line[2]);

    video.addRequests(endpoint, requests);
    video.addEndpoint(endpoint);

    if (!this.stats.minVideoRequests) {
      this.stats.minVideoRequests = video.requests;
    } else {
      this.stats.minVideoRequests = Math.min(video.requests, this.stats.minVideoSize);
    }
    if (!this.stats.maxVideoRequests) {
      this.stats.maxVideoRequests = video.requests;
    } else {
      this.stats.maxVideoRequests = Math.max(video.requests, this.stats.maxVideoRequests);
    }
  }

  calculateScore() {
    console.log(this.filename + ': scoring...', new Date() - this.startTime);
    this.videos.forEach(video => {
      video.caches.forEach(cache => {
        this.scores.push(new Score(video, cache, this.stats));
      });
    });

    this.scores = this.scores.sort((score1, score2) => {
      return score2.score - score1.score;
    });
  }

  cacheVideos() {

    console.log(this.filename + ': caching videos...', new Date() - this.startTime);

    this.scores.forEach(score => {
      if (score.cache.availableSize >= score.video.size) {
        score.cache.addVideo(score.video);
      }
    });

    // As file
    /*let videos = this.videos;

    // Asc
    /*videos = videos.sort((video1, video2) => {
      return video1.size - video2.size;
    });*/

    // Desc
    /*videos = videos.sort((video1, video2) => {
      return video2.size - video1.size;
    });

    videos.forEach(video => {
      video.cache();
    });*/
  }

  writeFile() {
    console.log(this.filename + ': writing file...', new Date() - this.startTime);
    if (fs.existsSync(this.filename + '.out')) {
      fs.unlinkSync(this.filename + '.out');
    }

    const output = fs.createWriteStream(this.filename + '.out');

    let cachesUsed = 0;
    this.caches.forEach(cache => {
      if (cache.videos.length) {
        cachesUsed++;
      }
    });

    output.write(cachesUsed + '\n');
    this.caches.forEach(cache => {
      if (cache.videos.length) {
        let lineToWrite = cache.id;
        cache.videos.forEach(video => {
          lineToWrite += (' ' + video.id);
        });
        output.write(lineToWrite + '\n');
      }
    });
  }
}

module.exports = YouTube;