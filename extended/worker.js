'use strict';

const Score = require('./score');

process.on('message', (m) => {
  switch (m.action) {

    case 'score':
      let video = m.video;
      let cache = m.cache;
      let caches = m.caches;
      let stats = m.stats;
      let endpoints = m.endpoints;
      let score = new Score(video, cache, caches, stats, endpoints);

      process.send({
        action: 'score',
        score: score,
      });
      break;
  }
});
