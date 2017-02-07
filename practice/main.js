'use strict';

const fs = require('fs');
const readline = require('readline');

const TOMATO = 'T';
const MUSHROOM = 'M';

class Config {
  constructor(line) {
    let words = line.split(' ');
    const R = parseInt(words[0]);
    const C = parseInt(words[1]);
    const L = parseInt(words[2]);
    const H = parseInt(words[3]);
    this.R = R;
    this.C = C;
    this.L = L;
    this.H = H;
  }
}

class Slice {
  constructor(cells, start, end) {
    this.cells = cells;
    this.start = start;
    this.end = end;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  isContainingEnoughIngredients(minIngredients) {
    let ingredients = {};
    ingredients[TOMATO] = 0;
    ingredients[MUSHROOM] = 0;
    this.cells.forEach(row => {
      row.forEach(column => {
        ingredients[column] += 1;
      })
    });
    return ingredients[TOMATO] >= minIngredients && ingredients[MUSHROOM] >= minIngredients;
  }

  get numberOfCells() {
    return ((this.end.row - this.start.row) + 1) * ((this.end.column - this.start.column) + 1);
  }

  get width() {
    return this.end.column - this.start.column + 1;
  }

  get height() {
    return this.end.row - this.start.row + 1;
  }
}

class Pizza {

  constructor() {
    this.rows = [];
    this.slices = [];
  }

  addRow(row) {
    this.rows.push(row.split(''));
  }

  cut(config) {
    this.findSmallestSlices(config);
    this.expandSlices(config);
  }

  getCells(start, end) {
    let cells = [];
    for (let rowIndex = start.row; rowIndex <= end.row; rowIndex++) {
      cells.push(this.rows[rowIndex].slice(start.column, end.column + 1));
    }
    return cells;
  }

  findSmallestSlices(config) {
    const minCells = config.L * 2;

    for (let width = 1; width <= minCells; width++) {
      for (let height = minCells; height >= 1; height--) {

        if ((width * height) === minCells) {

          for (let rowIndex = 0; rowIndex < config.R; rowIndex++) {
            for (let columnIndex = 0; columnIndex < config.C; columnIndex++) {
              let start = {row: rowIndex, column: columnIndex};
              let end = {row: rowIndex + height - 1, column: columnIndex + width - 1};

              if (end.row < config.R && end.column < config.C) {
                let cells = this.getCells(start, end);
                let slice = new Slice(cells, start, end);
                if (slice.isContainingEnoughIngredients(config.L) && !this.isOverlapped(slice)) {
                  this.slices.push(slice);
                }
              }
            }
          }

        }
      }
    }
  }

  isOverlapped(newSlice) {
    let overlapped = false;
    this.slices.forEach(existingSlice => {
      if (newSlice.id !== existingSlice.id) {
        if (newSlice.start.column <= existingSlice.end.column
          && newSlice.start.row <= existingSlice.end.row
          && existingSlice.start.column <= newSlice.end.column
          && existingSlice.start.row <= newSlice.end.row) {
          overlapped = true;
        }
      }
    });
    return overlapped;
  }

  expandSlices(config) {
    this.slices.forEach(slice => {
      this.expandSlice(slice, config);
    });
  }

  expandSlice(slice, config) {
    const maxCells = config.H;
    let start = slice.start;
    let end = slice.end;
    let canBeExpanded = false;

    if (start.row > 0) {
      let newStart = {row: start.row - 1, column: start.column};
      slice.start = newStart;
      if (slice.numberOfCells > maxCells || this.isOverlapped(slice)) {
        slice.start = start;
      } else {
        start = newStart;
        canBeExpanded = true;
      }
    }

    if (start.column > 0) {
      let newStart = {row: start.row, column: start.column - 1};
      slice.start = newStart;
      if (slice.numberOfCells > maxCells || this.isOverlapped(slice)) {
        slice.start = start;
      } else {
        start = newStart;
        canBeExpanded = true;
      }
    }

    if (end.row < (config.R-1)) {
      let newEnd = {row: end.row + 1, column: end.column};
      slice.end = newEnd;
      if (slice.numberOfCells > maxCells || this.isOverlapped(slice)) {
        slice.end = end;
      } else {
        end = newEnd;
        canBeExpanded = true;
      }
    }

    if (end.column < (config.C-1)) {
      let newEnd = {row: end.row, column: end.column + 1};
      slice.end = newEnd;
      if (slice.numberOfCells > maxCells || this.isOverlapped(slice)) {
        slice.end = end;
      } else {
        end = newEnd;
        canBeExpanded = true;
      }
    }

    if (canBeExpanded) {
      this.expandSlice(slice, config);
    }
  }
}

const files = ['example', 'small', 'medium', 'big'];

files.forEach(file => processFile(file));

function processFile(filename) {
  console.log(filename, 'start');
  if (fs.existsSync(filename + '.out')) {
    fs.unlinkSync(filename + '.out');
  }
  const input = fs.createReadStream(filename + '.in');
  const output = fs.createWriteStream(filename + '.out');

  const rl = readline.createInterface({
    input: input
  });

  let config = null;
  let pizza = new Pizza();

  rl.on('line', line => {
    if (!config) {
      config = new Config(line);
    } else {
      pizza.addRow(line);
    }
  });

  rl.on('close', () => {
    pizza.cut(config);

    output.write(pizza.slices.length + '\n');
    pizza.slices.forEach(slice => {
      output.write(slice.start.row + ' ' + slice.start.column + ' ' + slice.end.row + ' ' + slice.end.column + '\n');
    });
    console.log(filename, 'end');
  });
}
