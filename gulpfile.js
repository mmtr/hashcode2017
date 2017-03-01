'use strict';

const gulp = require('gulp');
const zip = require('gulp-zip');
const exec = require('child_process').exec;
const memory = Math.max(parseInt(require('os').freemem() / 1048576), 1024);

const execNodeScript = (round) => {
  console.log(`Executing node script using ${memory} MB of memory...`);
  let nodeProcess = exec(`cd ${round}; node --max-old-space-size=${memory} main.js`);
  nodeProcess.stdout.on('data', data => console.log(data));
  nodeProcess.stderr.on('data', data => console.error(data));
};

gulp.task('practice', () => {
  execNodeScript('practice');
});

gulp.task('qualification', () => {
  execNodeScript('qualification');
});

gulp.task('extended', () => {
  execNodeScript('extended');

  gulp.src('./extended/*.js')
    .pipe(zip('extended.zip'))
    .pipe(gulp.dest('extended'))
});