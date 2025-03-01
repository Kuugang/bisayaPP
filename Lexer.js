const { Position } = require("./Position.js");
const {
  Token,
  KEYWORDS,
  KEYWORD_PATTERN,

  TT_INT,
  TT_FLOAT,
  TT_LETRA,
  TT_STRING,
  TT_IDENTIFIER,
  TT_KEYWORD,
  TT_PLUS,
  TT_MINUS,
  TT_MUL,
  TT_DIV,
  TT_MOD,
  TT_POW,
  TT_EQ,
  TT_LPAREN,
  TT_RPAREN,
  TT_LSQUARE,
  TT_RSQUARE,
  TT_EE,
  TT_NE,
  TT_LT,
  TT_GT,
  TT_LTE,
  TT_GTE,
  TT_NOT,
  TT_COMMA,
  TT_ARROW,
  TT_NEWLINE,
  TT_EOF,
  TT_LBRACE,
  TT_RBRACE,
  TT_SEMICOLON,
  TT_INCREMENT,
  TT_DECREMENT,
  TT_COLON,
  TT_CONCAT,
} = require("./Token.js");
const { IllegalCharError, InvalidSyntaxError } = require("./Error.js");

class Lexer {
  constructor(fn, text) {
    this.fn = fn;
    this.text = text;
    this.pos = new Position(-1, 0, -1, fn, text);
    this.current_char = null;
    this.advance();
  }

  advance() {
    this.pos.advance(this.current_char);
    this.current_char =
      this.pos.idx < this.text.length ? this.text[this.pos.idx] : null;
  }

  make_tokens() {
    let tokens = [];
    while (this.current_char != null) {
      if (
        [" ", "\t", "#"].includes(this.current_char) ||
        this.current_char.charCodeAt(0) === 13
      ) {
        this.advance();
      } else if (/^[0-9]$/.test(this.current_char)) {
        tokens.push(this.make_number());
      } else if (/^\$|\n$/.test(this.current_char)) {
        tokens.push(new Token(TT_NEWLINE, this.current_char, this.pos, null));
        this.advance();
      } else if (this.current_char == ";") {
        tokens.push(new Token(TT_SEMICOLON, null, this.pos, null));
        this.advance();
      } else if (this.current_char == ":") {
        tokens.push(new Token(TT_COLON, null, this.pos, null));
        this.advance();
      } else if (this.current_char == "&") {
        tokens.push(new Token(TT_CONCAT, null, this.pos, null));
        this.advance();
      } else if (['"', "'"].includes(this.current_char)) {
        const [result, error] = this.make_string_or_symbol();
        if (error) return [null, error];
        tokens.push(result);
      } else if (/[a-zA-Z_]/.test(this.current_char)) {
        tokens.push(this.make_identifier());
      } else if (this.current_char == "+") {
        tokens.push(this.make_plus());
      } else if (this.current_char == "-") {
        tokens.push(this.make_minus());
      } else if (this.current_char == "*") {
        tokens.push(new Token(TT_MUL, null, this.pos, null));
        this.advance();
      } else if (this.current_char == "/") {
        tokens.push(new Token(TT_DIV, null, this.pos, null));
        this.advance();
      } else if (this.current_char == "%") {
        tokens.push(new Token(TT_MOD, null, this.pos, null));
        this.advance();
      } else if (this.current_char == "(") {
        tokens.push(new Token(TT_LPAREN, null, this.pos, null));
        this.advance();
      } else if (this.current_char == ")") {
        tokens.push(new Token(TT_RPAREN, null, this.pos, null));
        this.advance();
      } else if (this.current_char == "{") {
        tokens.push(new Token(TT_LBRACE, null, this.pos, null));
        this.advance();
      } else if (this.current_char == "}") {
        tokens.push(new Token(TT_RBRACE, null, this.pos, null));
        this.advance();
      } else if (this.current_char == "[") {
        let [result, error] = this.make_escaped();
        if (error) return [null, error];
        tokens.push(result);
      } else if (this.current_char == "=") {
        tokens.push(this.make_equal());
      } else if (this.current_char == ",") {
        tokens.push(new Token(TT_COMMA, null, this.pos, null));
        this.advance();
      } else if (this.current_char == ">") {
        tokens.push(this.make_greater());
      } else if (this.current_char == "<") {
        tokens.push(this.make_less());
      } else if (this.current_char == "!") {
        this.advance();
        tokens.push(new Token(TT_NOT, null, this.pos, null));
      } else {
        let pos_start = this.pos.copy();
        let char = this.current_char;
        this.advance();
        return [
          [],
          new IllegalCharError(pos_start, this.pos, "'" + char + "'"),
        ];
      }
    }

    //console.log(tokens.join("\n"));
    tokens.push(new Token(TT_EOF, null, this.pos, null));
    return [tokens, null];
  }

  advance_steps(steps) {
    for (let i = 0; i < steps; i++) {
      this.advance();
    }
  }

  make_escaped() {
    let pos_start = this.pos.copy();
    this.advance();
    let char = this.current_char;

    this.advance();
    if (this.current_char !== "]") {
      return [
        null,
        new InvalidSyntaxError(pos_start, this.pos, "Expected character"),
      ];
    }

    this.advance();

    return [new Token(TT_LETRA, char, pos_start, this.pos), null];
  }

  make_greater() {
    let token_type = TT_GT;

    let pos_start = this.pos.copy();

    this.advance();

    if (this.current_char == "=") {
      this.advance();
      token_type = TT_GTE;
    }

    return new Token(token_type, null, pos_start, this.pos);
  }

  make_less() {
    let token_type = TT_LT;

    let pos_start = this.pos.copy();

    this.advance();

    if (this.current_char == "=") {
      this.advance();
      token_type = TT_LTE;
    }

    if (this.current_char == ">") {
      this.advance();
      token_type = TT_NE;
    }

    return new Token(token_type, null, pos_start, this.pos);
  }

  make_equal() {
    let token_type = TT_EQ;

    let pos_start = this.pos.copy();

    this.advance();

    if (this.current_char == "=") {
      this.advance();
      token_type = TT_EE;
    }

    return new Token(token_type, null, pos_start, this.pos);
  }

  make_identifier() {
    let id_str = "";
    let pos_start = this.pos.copy();

    const max = KEYWORDS.reduce((max, word) => Math.max(max, word.length), 0);

    const next = this.text.substring(pos_start.idx, pos_start.idx + max);

    const match = KEYWORD_PATTERN.exec(next);

    if (match) {
      this.advance_steps(match[0].length);
      return new Token(TT_KEYWORD, match[0], pos_start, this.pos);
    }

    while (
      this.current_char != null &&
      /[a-zA-Z0-9_]/.test(this.current_char)
    ) {
      id_str += this.current_char;
      this.advance();
    }

    return new Token(TT_IDENTIFIER, id_str, pos_start, this.pos);
  }

  make_string_or_symbol() {
    let open = this.current_char;
    let id_str = "";

    let pos_start = this.pos.copy();
    this.advance();

    let type = TT_LETRA;

    while (this.current_char != open) {
      if (this.current_char === "\n" || this.current_char === null) {
        return [
          null,
          new InvalidSyntaxError(
            pos_start,
            this.pos,
            "Missing terminating " + open + " character",
          ),
        ];
      }
      id_str += this.current_char;
      this.advance();
    }

    this.advance();
    if (id_str.length > 1) type = TT_STRING;
    return [new Token(type, id_str, pos_start, this.pos), null];
  }

  make_plus() {
    let type = TT_PLUS;
    let pos_start = this.pos.copy();

    this.advance();
    if (this.current_char == "+") {
      type = TT_INCREMENT;
      this.advance();
      return new Token(type, null, pos_start, this.pos);
    } else {
      return new Token(type, null, pos_start, null);
    }
  }

  make_minus() {
    let type = TT_MINUS;
    let pos_start = this.pos.copy();

    this.advance();
    if (this.current_char == "-") {
      type = TT_DECREMENT;
      this.advance();
      return new Token(type, null, pos_start, this.pos);
    } else {
      return new Token(type, null, pos_start, null);
    }
  }

  make_number() {
    let num_str = "";
    let dot_count = 0;
    let pos_start = this.pos.copy();

    while (
      this.current_char != null &&
      /^[0-9]$|^\.$/.test(this.current_char)
    ) {
      if (this.current_char == ".") {
        if (dot_count == 1) break;
        dot_count += 1;
      }
      num_str += this.current_char;
      this.advance();
    }

    if (dot_count == 0) {
      return new Token(TT_INT, parseInt(num_str), pos_start, this.pos);
    } else {
      return new Token(TT_FLOAT, parseFloat(num_str), pos_start, this.pos);
    }
  }
}

module.exports = {
  Lexer,
};
