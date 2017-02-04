'use strict';

const fs = require('fs');
const readline = require('readline');

const TOMATO = 'T';
const MUSHROOM = 'M';

class Config {
  constructor(line) {
    const R = parseInt(line.charAt(0));
    const C = parseInt(line.charAt(2));
    const L = parseInt(line.charAt(4));
    const H = parseInt(line.charAt(6));
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

    // Horizontal
    for (let rowIndex = 0; rowIndex < config.R; rowIndex++) {
      for (let columnIndex = 0; columnIndex <= (config.C - minCells); columnIndex++) {
        let start = {row: rowIndex, column: columnIndex};
        let end = {row: rowIndex, column: columnIndex + minCells - 1};
        let cells = this.getCells(start, end);
        let slice = new Slice(cells, start, end);
        if (slice.isContainingEnoughIngredients(config.L) && !this.isOverlapped(slice)) {
          this.slices.push(slice);
          columnIndex += minCells;
        }
      }
    }

    // Vertical
    for (let columnIndex = 0; columnIndex < config.C; columnIndex++) {
      for (let rowIndex = 0; rowIndex <= (config.R - minCells); rowIndex++) {
        let start = {row: rowIndex, column: columnIndex};
        let end = {row: rowIndex + minCells - 1, column: columnIndex};
        let cells = this.getCells(start, end);
        let slice = new Slice(cells, start, end);
        if (slice.isContainingEnoughIngredients(config.L) && !this.isOverlapped(slice)) {
          this.slices.push(slice);
          rowIndex += minCells;
        }
      }
    }
  }

  isOverlapped(newSlice) {
    let overlapped = false;
    this.slices.forEach(existingSlice => {
      if (newSlice.id !== existingSlice.id) {
        let vertexs = [
          {
            row: newSlice.start.row,
            column: newSlice.start.column,
          },
          {
            row: newSlice.start.row,
            column: newSlice.end.column,
          },
          {
            row: newSlice.end.row,
            column: newSlice.start.column,
          },
          {
            row: newSlice.end.row,
            column: newSlice.end.column,
          },
        ];

        vertexs.forEach(vertex => {
          if (vertex.row >= existingSlice.start.row && vertex.column >= existingSlice.start.column
              && vertex.row <= existingSlice.end.row && vertex.column <= existingSlice.end.column) {
            overlapped = true;
          }
        });
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
    })
  });
}
