function string_with_arrows(text, posStart, posEnd) {
  let result = "";

  let idxStart = Math.max(text.lastIndexOf("\n", posStart.idx - 1), 0);
  let idxEnd = text.indexOf("\n", idxStart + 1);
  if (idxEnd === -1) idxEnd = text.length;

  let lineCount = posEnd.ln - posStart.ln + 1;
  for (let i = 0; i < lineCount; i++) {
    let line = text.slice(idxStart, idxEnd);

    let colStart = i === 0 ? posStart.col : 0;
    let colEnd = i === lineCount - 1 ? posEnd.col : line.length - 1;

    result += line + "\n";
    result += " ".repeat(colStart) + "^".repeat(colEnd - colStart) + "\n";

    idxStart = idxEnd;
    idxEnd = text.indexOf("\n", idxStart + 1);
    if (idxEnd === -1) idxEnd = text.length;
  }

  return result.replace(/\t/g, "");
}

class Error {
  constructor(pos_start, pos_end, error_name, details) {
    this.pos_start = pos_start;
    this.pos_end = pos_end;
    this.error_name = error_name;
    this.details = details;
  }

  as_string() {
    let result = `${this.error_name}: ${this.details}\n`;
    result += `File ${this.pos_start.fn}, line ${this.pos_start.ln + 1}`;
    result +=
      "\n\n" +
      string_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end);
    return result;
  }
}

class IllegalCharError extends Error {
  constructor(pos_start, pos_end, details) {
    super(pos_start, pos_end, "Illegal Character", details);
  }
}

class InvalidSyntaxError extends Error {
  constructor(pos_start, pos_end, details = "") {
    super(pos_start, pos_end, "Invalid Syntax", details);
  }
}

class SemanticError extends Error {
  constructor(pos_start, pos_end, details = "") {
    super(pos_start, pos_end, "Semantic Error", details);
  }
}

class RTError extends Error {
  constructor(pos_start, pos_end, details, context, type = "Runtime Error") {
    super(pos_start, pos_end, type, details);
    this.context = context;
  }

  as_string() {
    result = this.generate_traceback();
    result += `${this.error_name}: ${this.details}`;
    result +=
      "\n\n" +
      string_with_arrows(this.pos_start.ftxt, this.pos_start, this.pos_end);
    return result;
  }

  generate_traceback() {
    let result = "";
    let pos = this.pos_start;
    let ctx = this.context;
    while (ctx) {
      result =
        `  File ${pos.fn}, line ${pos.ln + 1}, in ${ctx.display_name}\n` +
        result;
      pos = ctx.parent_entry_pos;
      ctx = ctx.parent;
    }

    return "\nTraceback (most recent call last):\n" + result;
  }
}

class TypeError extends RTError {
  constructor(pos_start, pos_end, details = "", context) {
    super(pos_start, pos_end, details, context, "Type Error");
  }
}

module.exports = {
  Error,
  IllegalCharError,
  InvalidSyntaxError,
  SemanticError,
  RTError,
  TypeError,
};
