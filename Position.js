class Position {
  constructor(idx, ln, col, fn, ftxt) {
    this.idx = idx;
    this.ln = ln;
    this.col = col;
    this.fn = fn;
    this.ftxt = ftxt;
  }

  advance(current_char = null) {
    this.idx += 1;
    this.col += 1;

    if (current_char === "\n") {
      this.ln += 1;
      this.col = 0;
    }

    return this;
  }

  reverse(x = 1) {
    let newIdx = this.idx;
    let newLn = this.ln;
    let newCol = this.col;

    for (let i = 0; i < x; i++) {
      newIdx -= 1;
      const prevChar = this.ftxt[newIdx];

      if (prevChar === "\n") {
        newLn -= 1;
        // calculate column of previous line
        let j = newIdx - 1;
        let col = 0;
        while (j >= 0 && this.ftxt[j] !== "\n") {
          col += 1;
          j -= 1;
        }
        newCol = col;
      } else {
        newCol -= 1;
      }
    }

    return new Position(newIdx, newLn, newCol, this.fn, this.ftxt);
  }

  copy() {
    return new Position(this.idx, this.ln, this.col, this.fn, this.ftxt);
  }

  toString() {
    return "idx: " + this.idx;
  }
}

module.exports = {
  Position,
};
