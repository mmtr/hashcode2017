const Score = require('./score');

process.on('message', (m) => {
  console.log('CHILD got message:', m);

  switch (m.action) {

    case 'score':
      let video = m.video;
      let cache = m.cache;
      let stats = m.stats;
      let score = new Score(video, cache, stats);

      process.send({
        action: m.action,
        score: score ,
      });
      break;
  }
});
