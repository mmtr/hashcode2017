'use strict';

const files = ['me_at_the_zoo', 'videos_worth_spreading', 'trending_today', 'kittens'];

const YouTube = require('./youtube');

let processedFiles = 0;
const processNextFile = () => {
  let youTube = new YouTube(files[processedFiles]);
  youTube.start();
  youTube.on('end', () => {
    processedFiles++;
    if (processedFiles !== files.length) {
      processNextFile();
    }
  });
};

processNextFile();
