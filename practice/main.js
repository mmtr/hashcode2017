'use strict';

const fs = require('fs');
const readline = require('readline');

const files = ['example', 'small', 'medium', 'big'];

files.forEach(file => processFile(file));


function processFile(filename) {
  const input = fs.createReadStream(filename + '.in');
  const output = fs.createWriteStream(filename + '.out');

  const rl = readline.createInterface({
    input: input
  });

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
      this.id = '_' + Math.random().toString(36).substr(2, 9);
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
      return ((this.end[0] - this.start[0]) + 1) * ((this.end[1] - this.start[1]) + 1);
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
      for (let rowIndex = start[0]; rowIndex <= end[0]; rowIndex++) {
        cells.push(this.rows[rowIndex].slice(start[1], end[1] + 1));
      }
      return cells;
    }

    findSmallestSlices(config) {
      const minCells = config.L * 2;

      // Horizontal
      for (let rowIndex = 0; rowIndex < config.R; rowIndex++) {
        for (let columnIndex = 0; columnIndex <= (config.C - minCells); columnIndex++) {
          let start = [rowIndex, columnIndex];
          let end = [rowIndex, columnIndex + minCells - 1];
          let cells = this.getCells(start, end);
          let slice = new Slice(cells, start, end);
          if (slice.isContainingEnoughIngredients(config.L) && !this.containsCellUsedByAnotherSlice(slice)) {
            this.slices.push(slice);
            columnIndex++;
          }
        }
      }

      // Vertical
      for (let columnIndex = 0; columnIndex < config.C; columnIndex++) {
        for (let rowIndex = 0; rowIndex <= (config.R - minCells); rowIndex++) {
          let start = [rowIndex, columnIndex];
          let end = [rowIndex + minCells - 1, columnIndex];
          let cells = this.getCells(start, end);
          let slice = new Slice(cells, start, end);
          if (slice.isContainingEnoughIngredients(config.L) && !this.containsCellUsedByAnotherSlice(slice)) {
            this.slices.push(slice);
            rowIndex++;
          }
        }
      }
    }

    containsCellUsedByAnotherSlice(newSlice) {
      let conflictiveSlice = false;
      this.slices.forEach(existingSlice => {
        if (newSlice.id !== existingSlice.id) {
          if ((newSlice.start[0] >= existingSlice.start[0] && newSlice.start[1] >= existingSlice.start[1]
            && newSlice.start[0] <= existingSlice.end[0] && newSlice.start[1] <= existingSlice.end[1])
            || (newSlice.end[0] >= existingSlice.start[0] && newSlice.end[1] >= existingSlice.start[1]
            && newSlice.end[0] <= existingSlice.end[0] && newSlice.end[1] <= existingSlice.end[1])) {
            conflictiveSlice = true;
          }
        }
      });
      return conflictiveSlice;
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

      if (start[0] > 0) {
        let newStart = [start[0] - 1, start[1]];
        slice.start = newStart;
        if (slice.numberOfCells > maxCells || this.containsCellUsedByAnotherSlice(slice)) {
          slice.start = start;
        } else {
          start = newStart;
        }
      }

      if (start[1] > 0) {
        let newStart = [start[0], start[1] - 1];
        slice.start = newStart;
        if (slice.numberOfCells > maxCells || this.containsCellUsedByAnotherSlice(slice)) {
          slice.start = start;
        } else {
          start = newStart;
        }
      }

      if (end[0] < config.R) {
        let newEnd = [end[0] + 1, end[1]];
        slice.end = newEnd;
        if (slice.numberOfCells > maxCells || this.containsCellUsedByAnotherSlice(slice)) {
          slice.end = end;
        } else {
          end = newEnd;
        }
      }

      if (end[1] < config.C) {
        let newEnd = [end[0], end[1] + 1];
        slice.end = newEnd;
        if (slice.numberOfCells > maxCells || this.containsCellUsedByAnotherSlice(slice)) {
          slice.end = end;
        } else {
          end = newEnd;
        }
      }
    }
  }

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
      output.write(slice.start[0] + ' ' + slice.start[1] + ' ' + slice.end[0] + ' ' + slice.end[1] + '\n');
    })
  });
}
