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
