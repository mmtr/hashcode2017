'use strict';

const Score = require('./score');

process.on('message', (m) => {
  switch (m.action) {

    case 'score':
      let video = m.video;
      let cache = m.cache;
      let youtube = m.youtube;
      let score = new Score(video, cache, youtube);

      console.log('sending...');

      process.send({
        action: m.action,
        score: score ,
      });
      break;
  }
});
