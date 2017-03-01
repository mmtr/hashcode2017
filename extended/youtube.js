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
    this.videos = {};
    this.endpoints = {};
    this.caches = {};
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
      this.videos[video.id] = video;
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
    return this.endpoints[this.stats.endpoints - 1];
  }

  parseEndpoints(line) {
    if (this.stats.endpoints) {
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
    let endpoint = new Endpoint(this.stats.endpoints, line[0], line[1]);
    this.endpoints[endpoint.id] = endpoint;
    this.stats.endpoints++;
  }

  parseCacheConnection(line) {
    let cacheId = line[0];
    let cache = null;
    if (cacheId in this.caches) {
      cache = this.caches[cacheId];
    } else {
      cache = new Cache(cacheId, this.config.cacheSize);
      this.caches[cache.id] = cache;
      this.stats.caches++;
    }
    this.lastEndpoint.addCache(cache, line[1]);
    cache.addEndpoint(this.lastEndpoint);
  }

  parseRequestDescriptions(line) {
    let video = this.videos[line[0]];
    let endpoint = this.endpoints[line[1]];
    let requests = parseInt(line[2]);

    video.addRequests(requests);
    video.addEndpoint(endpoint);

    if (!this.stats.minVideoRequests) {
      this.stats.minVideoRequests = video.requests;
    } else {
      this.stats.minVideoRequests = Math.min(video.requests, this.stats.minVideoRequests);
    }
    if (!this.stats.maxVideoRequests) {
      this.stats.maxVideoRequests = video.requests;
    } else {
      this.stats.maxVideoRequests = Math.max(video.requests, this.stats.maxVideoRequests);
    }
  }

  calculateScore() {
    console.log(this.filename + ': scoring...', new Date() - this.startTime);

    /*let cp = require('child_process');
    let workers = [];

    for (let i = 1; i <= require('os').cpus().length; i++) {
      let worker = cp.fork('./worker');
      worker.on('message', m => {
        console.log(m);
        switch (m.action) {
          case 'score':
            this.scores.push(m.score);
            break;
        }
      });
      workers.push(worker);
    }

    let videoCachePairs = [];
    Object.keys(this.videos).forEach(videoId => {
      let video = this.videos[videoId];
      video.caches.forEach(cacheId => {
        let cache = this.caches[cacheId];
        if (cache.size >= video.size) {
          videoCachePairs.push({
            video: video,
            cache: cache,
          });
        }
      });
    });
    let totalVideoCachePairs = videoCachePairs.length;

    const launchWorker = (worker) => {
      let videoCachePair = videoCachePairs.pop();
      console.log('launching worker...');

      worker.send({
        action: 'score',
        video: videoCachePair.video,
        cache: videoCachePair.cache,
        youtube: this
      });
    };

    console.log(workers.length);

    workers.forEach(worker => {
      if (videoCachePairs.length) {
        launchWorker(worker);
      }

      worker.on('exit', () => {
        console.log('exit');
        if (videoCachePairs.length) {
          launchWorker(worker);
        }
      });
    });

    while (this.scores.length !== totalVideoCachePairs) {

    }

    console.log(this.scores);

    workers.forEach(worker => {
      worker.disconnect();
    });*/

    let videoIndex = 0;
    Object.keys(this.videos).forEach(videoId => {
      videoIndex++;
      if (videoIndex % 1000 === 0) {
        console.log(`Video ${videoIndex}/${Object.keys(this.videos).length}`);
      }
      let video = this.videos[videoId];
      video.caches.forEach(cacheId => {
        let cache = this.caches[cacheId];
        if (cache.size >= video.size) {
          this.scores.push(new Score(video, cache, this));
        }
      });
    });

    this.scores = this.scores.sort((score1, score2) => {
      return score2.score - score1.score;
    });

    //console.log(this.scores);
  }

  cacheVideos() {
    console.log(this.filename + ': caching videos...', new Date() - this.startTime);
    let scoreIndex = 0;

    this.scores.forEach(score => {
      scoreIndex++;
      if (scoreIndex % 10000 === 0) {
        console.log(`Pair video-cache ${scoreIndex}/${this.scores.length}`);
      }
      score.cache.addVideo(score.video, this);
    });
  }

  writeFile() {
    console.log(this.filename + ': writing file...', new Date() - this.startTime);
    if (fs.existsSync(this.filename + '.out')) {
      fs.unlinkSync(this.filename + '.out');
    }

    const output = fs.createWriteStream(this.filename + '.out');

    let cachesUsed = 0;
    Object.keys(this.caches).forEach(cacheId => {
      let cache = this.caches[cacheId];
      if (cache.videos.length) {
        cachesUsed++;
      }
    });

    output.write(cachesUsed + '\n');
    Object.keys(this.caches).forEach(cacheId => {
      let cache = this.caches[cacheId];
      if (cache.videos.length) {
        let lineToWrite = cache.id;
        cache.videos.forEach(videoId => {
          lineToWrite += (' ' + videoId);
        });
        output.write(lineToWrite + '\n');
      }
    });
  }
}

module.exports = YouTube;
