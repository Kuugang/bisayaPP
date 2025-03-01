const TT_INT = "NUMERO";
const TT_FLOAT = "TIPIK";
const TT_LETRA = "LETRA";
const TT_STRING = "STRING";
const TT_BOOLEAN = "TINUOD";
const TT_SEMICOLON = "SEMICOLON";
const TT_INCREMENT = "INCREMENT";
const TT_DECREMENT = "DECREMENT";
const TT_COLON = "COLON";
const TT_CONCAT = "CONCAT";

const TT_IDENTIFIER = "IDENTIFIER";
const TT_KEYWORD = "KEYWORD";
const TT_PLUS = "PLUS";
const TT_MINUS = "MINUS";
const TT_MUL = "MUL";
const TT_DIV = "DIV";
const TT_MOD = "MOD";
const TT_POW = "POW";
const TT_EQ = "EQ";
const TT_LPAREN = "LPAREN";
const TT_RPAREN = "RPAREN";
const TT_LBRACE = "LBRACE";
const TT_RBRACE = "RBRACE";
const TT_LSQUARE = "LSQUARE";
const TT_RSQUARE = "RSQUARE";
const TT_EE = "EE";
const TT_NE = "NE";
const TT_LT = "LT";
const TT_GT = "GT";
const TT_LTE = "LTE";
const TT_GTE = "GTE";
const TT_NOT = "TT_NOT";
const TT_COMMA = "COMMA";
const TT_ARROW = "ARROW";
const TT_NEWLINE = "NEWLINE";
const TT_EOF = "EOF";

const KEYWORDS = [
  "SUGOD", //START
  "KATAPUSAN", //END
  "MUGNA", //KEYWORD WHEN DECLARING VARIABLE EG. MUGNA NUMERO x = 5
  "NUMERO", //INT
  "LETRA", //CHAR
  "TINUOD", //BOOLEAN
  "TIPIK", //FLOAT
  "UG", //AND
  "O", //OR
  "DILI", //FALSE
  "OO", //TRUE
  "KUNG", //IF
  "KUNG DILI", //ELSE IF
  "KUNG WALA", //ELSE
  "PUNDOK", // {} block of code
  "ALANG SA", //FOR LOOP
  "IPAKITA", //PRINT
  "SAMTANG", //WHILE LOOP
  "HUNONG", //BREAK,
  "PADAYON", //CONTINUE
  "IULI", //RETURN,
  "WALA", //void
  "LIHOK", //FUNCTION
];

const KEYWORD_PATTERN = new RegExp(
  `^\\b(${KEYWORDS.sort((a, b) => b.length - a.length).join("|")})\\b`,
);

class Token {
  constructor(type, value, pos_start, pos_end) {
    this.type = type;
    this.value = value;

    if (pos_start) {
      this.pos_start = pos_start.copy();
      this.pos_end = pos_start.copy();
      this.pos_end.advance();
    }
    if (pos_end) {
      this.pos_end = pos_end.copy();
    }
  }

  matches(type, value) {
    return this.type === type && this.value === value;
  }

  toString() {
    if (this.value) {
      return this.type + ":" + this.value;
    }
    return this.type + ": ";
  }
}

module.exports = {
  Token,
  TT_INT,
  TT_FLOAT,
  TT_LETRA,
  TT_STRING,
  TT_BOOLEAN,
  TT_SEMICOLON,
  TT_INCREMENT,
  TT_DECREMENT,
  TT_COLON,
  TT_CONCAT,

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
  TT_LBRACE,
  TT_RBRACE,
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
  KEYWORDS,
  KEYWORD_PATTERN,
};
