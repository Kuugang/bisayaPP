const { InvalidSyntaxError, TypeError, SemanticError } = require("./Error.js");
const {
  CallNode,
  VarAssignNode,
  VarAccessNode,
  CharNode,
  StringNode,
  BooleanNode,
  NumberNode,
  UnaryOperationNode,
  ListNode,
  BinaryOperationNode,
  ForNode,
  PostfixOperationNode,
  PrintNode,
  Block,
  WhileNode,
  BreakNode,
  ContinueNode,
  FuncDefNode,
  ReturnNode,
  InputNode,
} = require("./Node.js");
const {
  Token,
  KEYWORDS,
  KEYWORD_PATTERN,

  TT_INT,
  TT_FLOAT,
  TT_LETRA,
  TT_STRING,
  TT_BOOLEAN,
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
  TT_COMMA,
  TT_ARROW,
  TT_NEWLINE,
  TT_EOF,
  TT_NOT,
  TT_LBRACE,
  TT_RBRACE,
  TT_SEMICOLON,
  TT_INCREMENT,
  TT_DECREMENT,
  TT_COLON,
  TT_CONCAT,
} = require("./Token.js");

class ParseResult {
  constructor() {
    this.error = null;
    this.node = null;
    this.current_tok = null;
    this.last_registered_advance_count = 0;
    this.advance_count = 0;
    this.to_reverse_count = 0;
  }

  register_advancement() {
    this.last_registered_advance_count = 1;
    this.advance_count += 1;
  }

  register(res) {
    this.last_registered_advance_count = res.advance_count;
    this.advance_count += res.advance_count;
    if (res.error) this.error = res.error;
    return res.node;
  }

  try_register(res) {
    if (res.error) {
      this.to_reverse_count = res.advance_count;
    }
    return this.register(res);
  }

  success(node) {
    this.node = node;
    return this;
  }

  failure(error) {
    if (!this.error || this.last_registered_advance_count === 0)
      this.error = error;
    return this;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.tok_idx = -1;
    this.current_tok = null;
    this.advance();
  }

  peek(count) {
    let idx = this.tok_idx + count;
    if (idx < 0 || idx >= this.tokens.length) return null;
    return this.tokens[idx];
  }

  advance() {
    this.tok_idx += 1;
    this.update_current_tok();
    return this.current_tok;
  }

  reverse(amount = 1) {
    this.tok_idx -= amount;
    this.update_current_tok();
    return this.current_tok;
  }

  update_current_tok() {
    if (this.tok_idx >= 0 && this.tok_idx < this.tokens.length)
      this.current_tok = this.tokens[this.tok_idx];
  }

  parse() {
    let res = new ParseResult();
    let pos_start = this.current_tok.pos_start.copy();

    while (this.current_tok.type === TT_NEWLINE) {
      res.register_advancement();
      this.advance();
    }

    if (!this.current_tok.matches(TT_KEYWORD, "SUGOD")) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'SUGOD'",
        ),
      );
    }
    res.register_advancement();
    this.advance();

    while (this.current_tok.type === TT_NEWLINE) {
      res.register_advancement();
      this.advance();
    }

    if (this.current_tok.matches(TT_KEYWORD, "KATAPUSAN")) {
      return res.success(
        new ListNode([], pos_start, this.current_tok.pos_end.copy()),
      );
    }

    res = this.statements();
    if (res.error) return res;

    while (this.current_tok.type === TT_NEWLINE) {
      this.advance();
    }

    if (!this.current_tok.matches(TT_KEYWORD, "KATAPUSAN")) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'KATAPUSAN'",
        ),
      );
    }
    this.advance();

    while (this.current_tok.type === TT_NEWLINE) {
      this.advance();
    }

    if (this.current_tok.type !== TT_EOF) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Token cannot appear after previous tokens",
        ),
      );
    }

    return res;
  }

  statements() {
    let res = new ParseResult();
    let statements = [];
    let pos_start = this.current_tok.pos_start.copy();

    while (this.current_tok.type === TT_NEWLINE) {
      res.register_advancement();
      this.advance();
    }

    let statement = res.register(this.statement());
    if (res.error) return res;
    statements.push(statement);

    let more_statements = true;

    while (true) {
      let newline_count = 0;

      while (this.current_tok.type === TT_NEWLINE) {
        res.register_advancement();
        this.advance();
        newline_count += 1;
      }

      if (newline_count === 0) more_statements = false;
      if (!more_statements) break;
      if (
        this.current_tok.matches(TT_KEYWORD, "KATAPUSAN") ||
        this.current_tok.type == TT_EOF
      ) {
        break;
      }

      statement = res.try_register(this.statement());
      if (statement === null) {
        this.reverse(res.to_reverse_count);
        more_statements = false;
        continue;
      }

      statements.push(statement);
    }
    return res.success(
      new ListNode(statements, pos_start, this.current_tok.pos_end.copy()),
    );
  }

  statement() {
    let res = new ParseResult();
    let pos_start = this.current_tok.pos_start.copy();

    if (this.current_tok.matches(TT_KEYWORD, "IULI")) {
      res.register_advancement();
      this.advance();

      let expr = res.try_register(this.expr());
      if (!expr) this.reverse(res.to_reverse_count);

      return res.success(
        new ReturnNode(expr, pos_start, this.current_tok.pos_start.copy()),
      );
    }

    if (this.current_tok.matches(TT_KEYWORD, "PADAYON")) {
      res.register_advancement();
      this.advance();
      return res.success(
        new ContinueNode(pos_start, this.current_tok.pos_start.copy()),
      );
    }

    if (this.current_tok.matches(TT_KEYWORD, "HUNONG")) {
      res.register_advancement();
      this.advance();
      return res.success(
        new BreakNode(pos_start, this.current_tok.pos_start.copy()),
      );
    }

    if (this.current_tok.matches(TT_KEYWORD, "IPAKITA")) {
      let print_statement = res.register(this.print_statement());
      return res.success(print_statement);
    }

    if (this.current_tok.matches(TT_KEYWORD, "DAWAT")) {
      let input_statement = res.register(this.input_statement());
      return res.success(input_statement);
    }

    let expr = res.register(this.expr());
    if (res.error) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'DAWAT, 'IPAKITA', 'IULI', 'PADAYON', 'HUNONG', 'MUGNA', 'KUNG', 'ALANG SA', 'SAMTANG', 'LIHOK', int, float, identifier, '+', '-', '(', '[' or 'NOT'",
        ),
      );
    }

    return res.success(expr);
  }

  print_statement = () => {
    let res = new ParseResult();
    let pos_start = this.current_tok.pos_start.copy();

    if (!this.current_tok.matches(TT_KEYWORD, "IPAKITA")) {
      return res.failure(
        new InvalidSyntaxError(
          pos_start,
          this.current_tok.pos_end,
          "Expected 'IPAKITA'",
        ),
      );
    }
    res.register_advancement();
    this.advance();

    if (this.current_tok.type !== TT_COLON) {
      return res.failure(
        new InvalidSyntaxError(
          pos_start,
          this.current_tok.pos_end,
          "Expected ':'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let args = [];

    args.push(res.register(this.expr()));
    if (res.error) return res;
    while (this.current_tok.type === TT_CONCAT) {
      res.register_advancement();
      this.advance();

      args.push(res.register(this.expr()));
      if (res.error) return res;
    }

    return res.success(new PrintNode(pos_start, args));
  };

  input_statement() {
    let res = new ParseResult();
    let pos_start = this.current_tok.pos_start.copy();

    if (this.current_tok.matches(TT_KEYWORD, "DAWWAT")) {
      return res.failure(
        new InvalidSyntaxError(
          pos_start,
          this.current_tok.pos_end,
          "Expected 'DAWAT'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    if (this.current_tok.type !== TT_COLON) {
      return res.failure(
        new InvalidSyntaxError(
          pos_start,
          this.current_tok.pos_end,
          "Expected ':'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let vars_toks = [];

    if (this.current_tok.type !== TT_IDENTIFIER) {
      return res.failure(
        new InvalidSyntaxError(
          pos_start,
          this.current_tok.pos_end,
          "Expected identifier",
        ),
      );
    }

    vars_toks.push(this.current_tok);
    res.register_advancement();
    this.advance();
    while (this.current_tok.type === TT_COMMA) {
      res.register_advancement();
      this.advance();

      if (this.current_tok.type !== TT_IDENTIFIER) {
        return res.failure(
          new InvalidSyntaxError(
            pos_start,
            this.current_tok.pos_end,
            "Expected identifier",
          ),
        );
      }

      vars_toks.push(this.current_tok);
      res.register_advancement();
      this.advance();
    }

    return res.success(new InputNode(pos_start, vars_toks));
  }

  expr = () => {
    let res = new ParseResult();

    if (this.current_tok.matches(TT_KEYWORD, "MUGNA")) {
      let vars = res.register(this.var_def());

      if (res.error) return res;
      return res.success(vars);
    }

    if (this.current_tok.type === TT_IDENTIFIER) {
      let var_name = this.current_tok;
      res.register_advancement();
      this.advance();

      if (this.current_tok.type === TT_EQ) {
        let var_assignment = res.register(this.var_assign(var_name));
        if (res.error) return res;
        return res.success(var_assignment);
      }
      this.reverse(res.advance_count);
    }
    let node = res.register(
      this.bin_op(this.comp_expr, [
        [TT_KEYWORD, "UG"],
        [TT_KEYWORD, "O"],
      ]),
    );

    if (res.error) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'VAR', 'IF', 'FOR', 'WHILE', 'FUN', int, float, identifier, '+', '-', '(', '[' or 'NOT'",
        ),
      );
    }
    return res.success(node);
  };

  var_def = (count) => {
    let res = new ParseResult();
    let type = null;

    if (!this.current_tok.matches(TT_KEYWORD, "MUGNA")) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'MUGNA'",
        ),
      );
    }
    res.register_advancement();
    this.advance();

    switch (this.current_tok.value) {
      case "NUMERO":
        type = TT_INT;
        break;
      case "TIPIK":
        type = TT_FLOAT;
        break;
      case "LETRA":
        type = TT_LETRA;
        break;
      case "TINUOD":
        type = TT_BOOLEAN;
        break;
      case "PULONG":
        type = TT_STRING;
        break;
    }

    if (
      !["NUMERO", "TIPIK", "LETRA", "PULONG", "TINUOD"].includes(
        this.current_tok.value,
      )
    ) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'NUMERO', 'TIPIK', 'LETRA', 'PULONG', 'TINUOD'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    if (this.current_tok.type != TT_IDENTIFIER) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected identifier",
        ),
      );
    }

    let var_name = this.current_tok;
    res.register_advancement();
    this.advance();

    return this.var_assign(var_name, type, count);
  };

  var_assign = (var_name, type = null, count = null) => {
    let res = new ParseResult();
    let toks = [var_name];
    let value = null;

    while (this.current_tok.type === TT_EQ) {
      res.register_advancement();
      this.advance();

      value = res.register(this.expr());
      if (res.error) return res;

      if (
        value instanceof BinaryOperationNode ||
        value instanceof NumberNode ||
        value instanceof BooleanNode
      ) {
        if (this.current_tok.type === TT_EQ) {
          return res.failure(
            new SemanticError(
              value.pos_start,
              value.pos_end,
              "lvalue required as left operand of assignment",
            ),
          );
        }
      }

      toks.push(value.var_name_tok);
    }

    if (this.current_tok.type !== TT_COMMA) {
      return res.success(new VarAssignNode(type, var_name, value));
    }

    let nodes = [];

    nodes.push(new VarAssignNode(type, var_name, value));

    for (let i = 1; i < toks.length - 1; i++) {
      nodes.push(new VarAssignNode(type, toks[i], value));
    }

    while (this.current_tok.type === TT_COMMA) {
      if (nodes.length === count) break;
      res.register_advancement();
      this.advance();

      if (this.current_tok.type != TT_IDENTIFIER) {
        return res.failure(
          new InvalidSyntaxError(
            this.current_tok.pos_start,
            this.current_tok.pos_end,
            "Expected identifier",
          ),
        );
      }

      var_name = this.current_tok;
      res.register_advancement();
      this.advance();

      let toks = [var_name];
      let value;

      while (this.current_tok.type === TT_EQ) {
        if (nodes.length === count) break;
        res.register_advancement();
        this.advance();

        value = res.register(this.expr());
        if (res.error) return res;

        if (
          value instanceof BinaryOperationNode ||
          value instanceof NumberNode
        ) {
          if (this.current_tok.type === TT_EQ) {
            return res.failure(
              new SemanticError(
                value.pos_start,
                value.pos_end,
                "lvalue required as left operand of assignment",
              ),
            );
          }
        }
        toks.push(value.var_name_tok);
      }

      nodes.push(new VarAssignNode(type, var_name, value));

      for (let i = 1; i < toks.length - 1; i++) {
        nodes.push(new VarAssignNode(type, toks[i], value));
      }
    }

    return res.success(
      new ListNode(nodes, var_name.pos_start, this.current_tok.pos_end.copy()),
    );
  };

  comp_expr = () => {
    let res = new ParseResult();
    if (this.current_tok.type === TT_NOT) {
      let op_tok = this.current_tok;
      res.register_advancement();
      this.advance();

      let node = res.register(this.comp_expr());
      if (res.error) return res;
      return res.success(new UnaryOperationNode(op_tok, node));
    }
    let node = res.register(
      this.bin_op(this.arith_expr, [
        TT_EE,
        TT_NE,
        TT_LT,
        TT_LTE,
        TT_GT,
        TT_GTE,
      ]),
    );

    if (res.error) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected int, float, identifier, '+', '-', '(', '[' or 'NOT'",
        ),
      );
    }
    return res.success(node);
  };

  arith_expr = () => {
    return this.bin_op(this.term, [TT_PLUS, TT_MINUS]);
  };

  term = () => {
    return this.bin_op(this.factor, [TT_MUL, TT_DIV, TT_MOD]);
  };

  factor = () => {
    let res = new ParseResult();
    let op_tok = this.current_tok;

    if ([TT_PLUS, TT_MINUS].includes(this.current_tok.type)) {
      res.register_advancement();
      this.advance();

      let factor = res.register(this.factor());
      if (res.error) return res;

      return res.success(new UnaryOperationNode(op_tok, factor));
    }

    let node = res.register(this.power());
    if (res.error) return res;

    if ([TT_INCREMENT, TT_DECREMENT].includes(this.current_tok.type)) {
      let op_tok = this.current_tok;
      res.register_advancement();
      this.advance();

      return res.success(new PostfixOperationNode(node, op_tok));
    }
    return res.success(node);
  };

  call = () => {
    let res = new ParseResult();

    let atom = res.register(this.atom());

    if (res.error) {
      return res;
    }

    if (this.current_tok.type == TT_LPAREN) {
      res.register_advancement();
      this.advance();
      let arg_nodes = [];

      if (this.current_tok.type == TT_RPAREN) {
        res.register_advancement();
        this.advance();
      } else {
        arg_nodes.push(res.register(this.expr()));
        if (res.error) {
          return res.failure(
            new InvalidSyntaxError(
              this.current_tok.pos_start,
              this.current_tok.pos_end,
              "Expected ')', 'VAR', 'IF', 'FOR', 'WHILE', 'FUN', int, float, identifier, '+', '-', '(', '[' or 'NOT'",
            ),
          );
        }

        while (this.current_tok.type == TT_COMMA) {
          res.register_advancement();
          this.advance();

          arg_nodes.push(res.register(this.expr()));
          if (res.error) return res;
        }

        if (this.current_tok.type != TT_RPAREN) {
          return res.failure(
            new InvalidSyntaxError(
              this.current_tok.pos_start,
              this.current_tok.pos_end,
              "Expected ',' or ')'",
            ),
          );
        }

        res.register_advancement();
        this.advance();
      }
      return res.success(new CallNode(atom, arg_nodes));
    }

    return res.success(atom);
  };

  power() {
    return this.bin_op(this.call, [TT_POW], this.factor);
  }

  atom() {
    let res = new ParseResult();

    let tok = this.current_tok;

    if ([TT_FLOAT, TT_INT].includes(tok.type)) {
      res.register_advancement();
      this.advance();
      return res.success(new NumberNode(tok, tok.type));
    } else if (this.current_tok.type === TT_LETRA) {
      res.register_advancement();
      this.advance();
      return res.success(new CharNode(tok));
    } else if (this.current_tok.type === TT_STRING) {
      res.register_advancement();
      this.advance();
      return res.success(new StringNode(tok));
    } else if (this.current_tok.matches(TT_KEYWORD, "OO")) {
      res.register_advancement();
      this.advance();
      return res.success(new BooleanNode(tok));
    } else if (this.current_tok.matches(TT_KEYWORD, "DILI")) {
      res.register_advancement();
      this.advance();
      return res.success(new BooleanNode(tok));
    } else if (this.current_tok.type === TT_IDENTIFIER) {
      res.register_advancement();
      this.advance();
      return res.success(new VarAccessNode(tok));
    } else if (tok.type == TT_LPAREN) {
      res.register_advancement();
      this.advance();
      let expr = res.register(this.expr());
      if (res.error) return res;
      if (this.current_tok.type == TT_RPAREN) {
        res.register_advancement();
        this.advance();
        return res.success(expr);
      } else {
        return res.failure(
          new InvalidSyntaxError(
            this.current_tok.pos_start,
            this.current_tok.pos_end,
            "Expected ')'",
          ),
        );
      }
    } else if (tok.matches(TT_KEYWORD, "ALANG SA")) {
      let for_expr = res.register(this.for_expr());
      if (res.error) return res;
      return res.success(for_expr);
    } else if (tok.matches(TT_KEYWORD, "SAMTANG")) {
      let for_expr = res.register(this.while_expr());
      if (res.error) return res;
      return res.success(for_expr);
    } else if (tok.matches(TT_KEYWORD, "LIHOK")) {
      let func_def = res.register(this.func_def());
      if (res.error) return res;
      return res.success(func_def);
    } else if (tok.type == TT_NEWLINE && tok.value == "$") {
      res.register_advancement();
      this.advance();
      return res.success(
        new CharNode(
          new Token(TT_LETRA, "\n", tok.pos_start.copy(), tok.pos_end.copy()),
        ),
      );
    }

    return res.failure(
      new InvalidSyntaxError(
        tok.pos_start,
        tok.pos_end,
        "Expected int, float, identifier, '+', '-', '(', '[', 'IF', 'FOR', 'WHILE' or 'FUN'",
      ),
    );
  }

  for_expr = () => {
    let res = new ParseResult();
    if (!this.current_tok.matches(TT_KEYWORD, "ALANG SA")) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'ALANG SA'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    if (this.current_tok.type !== TT_LPAREN) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected '('",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let init_node;
    if (this.current_tok.matches(TT_KEYWORD, "MUGNA")) {
      init_node = res.register(this.var_def(1));
      if (res.error) return res;
    } else if (this.peek(1).type === TT_EQ) {
      let var_name = this.current_tok;
      res.register_advancement();
      this.advance();

      init_node = res.register(this.var_assign(var_name, null, 1));
      if (res.error) return res;
    } else {
      init_node = res.register(this.expr());
      if (res.error) return res;
    }

    if (!init_node) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected initializer",
        ),
      );
    }

    if (this.current_tok.type !== TT_COMMA) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected ','",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let condition_node = res.register(this.expr());
    if (res.error) return res;

    if (this.current_tok.type !== TT_COMMA) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected ','",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let update_node = res.register(this.expr());
    if (res.error) return res;

    if (this.current_tok.type !== TT_RPAREN) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected ')'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let body = res.register(this.block("<loop>"));
    if (res.error) return res;

    return res.success(
      new ForNode(init_node, condition_node, update_node, body, false),
    );
  };

  while_expr() {
    let res = new ParseResult();

    if (!this.current_tok.matches(TT_KEYWORD, "SAMTANG")) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'SAMTANG'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    if (this.current_tok.type !== TT_LPAREN) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected '('",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let condition = res.register(this.expr());
    if (res.error) return res;

    if (this.current_tok.type !== TT_RPAREN) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected ')'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let body = res.register(this.block("<loop>"));
    if (res.error) return res;

    return res.success(new WhileNode(condition, body));
  }

  func_def() {
    let res = new ParseResult();
    let pos_start = this.current_tok.pos_start.copy();

    if (!this.current_tok.matches(TT_KEYWORD, "LIHOK")) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'LIHOK'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    if (this.current_tok.type !== TT_IDENTIFIER) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected identifier",
        ),
      );
    }

    let func_name_token = this.current_tok;

    res.register_advancement();
    this.advance();

    if (this.current_tok.type !== TT_LPAREN) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected '('",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    let args = [];

    while (this.current_tok.type !== TT_RPAREN) {
      if (
        !["NUMERO", "TIPIK", "LETRA", "TINUOD"].includes(this.current_tok.value)
      ) {
        return res.failure(
          new InvalidSyntaxError(
            this.current_tok.pos_start,
            this.current_tok.pos_end,
            "Expected data type",
          ),
        );
      }

      let type = this.current_tok.value;

      res.register_advancement();
      this.advance();

      if (this.current_tok.type !== TT_IDENTIFIER) {
        return res.failure(
          new InvalidSyntaxError(
            this.current_tok.pos_start,
            this.current_tok.pos_end,
            "Expected identifier",
          ),
        );
      }

      args.push({ type: type, name: this.current_tok });
      res.register_advancement();
      this.advance();
      if (this.current_tok.type === TT_COMMA) {
        res.register_advancement();
        this.advance();
      }
    }
    res.register_advancement();
    this.advance();

    let return_type = null;
    if (
      ["NUMERO", "TIPIK", "LETRA", "TINUOD"].includes(this.current_tok.value)
    ) {
      switch (this.current_tok.value) {
        case "NUMERO":
          return_type = TT_INT;
          break;
        case "TIPIK":
          return_type = TT_FLOAT;
          break;
        case "LETRA":
          return_type = TT_LETRA;
          break;
        case "TINUOD":
          return_type = TT_BOOLEAN;
          break;
      }
      res.register_advancement();
      this.advance();
    }
    let body = res.register(this.block(func_name_token.value));
    if (res.error) return res;

    return res.success(
      new FuncDefNode(func_name_token, args, body, return_type),
    );
  }

  block(name) {
    let res = new ParseResult();
    let statements = [];
    let pos_start = this.current_tok.pos_start.copy();

    while (this.current_tok.type === TT_NEWLINE) {
      res.register_advancement();
      this.advance();
    }

    if (!this.current_tok.matches(TT_KEYWORD, "PUNDOK")) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected 'PUNDOK'",
        ),
      );
    }
    res.register_advancement();
    this.advance();

    while (this.current_tok.type === TT_NEWLINE) {
      res.register_advancement();
      this.advance();
    }

    if (this.current_tok.type !== TT_LBRACE) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected '{'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    while (this.current_tok.type === TT_NEWLINE) {
      res.register_advancement();
      this.advance();
    }

    if (this.current_tok.type === TT_RBRACE) {
      res.register_advancement();
      this.advance();
      return res.success(
        new ListNode([], pos_start, this.current_tok.pos_end.copy()),
      );
    }

    while (this.current_tok.type === TT_NEWLINE) {
      res.register_advancement();
      this.advance();
    }

    let statement = res.register(this.statement());
    if (res.error) return res;
    statements.push(statement);

    while (true) {
      let newline_count = 0;

      while (this.current_tok.type === TT_NEWLINE) {
        res.register_advancement();
        this.advance();
        newline_count += 1;
      }

      if (this.current_tok.type === TT_RBRACE) {
        break;
      }

      if (newline_count === 0) {
        return res.failure(
          new InvalidSyntaxError(
            this.current_tok.pos_start,
            this.current_tok.pos_end,
            "Expected newline or '}'",
          ),
        );
      }

      statement = res.try_register(this.statement());
      if (!statement) {
        this.reverse(res.to_reverse_count);
        break;
      }

      statements.push(statement);
    }
    if (this.current_tok.type !== TT_RBRACE) {
      return res.failure(
        new InvalidSyntaxError(
          this.current_tok.pos_start,
          this.current_tok.pos_end,
          "Expected '}'",
        ),
      );
    }

    res.register_advancement();
    this.advance();

    return res.success(
      new Block(statements, name, pos_start, this.current_tok.pos_end.copy()),
    );
  }

  bin_op(func_a, ops, func_b = null) {
    if (func_b === null) {
      func_b = func_a;
    }

    let res = new ParseResult();
    let left = res.register(func_a());

    if (res.error) return res;

    while (
      typeof ops[0] === "object"
        ? ops.some((op) =>
            op.every(
              (val, index) =>
                val === [this.current_tok.type, this.current_tok.value][index],
            ),
          )
        : ops.includes(this.current_tok.type)
    ) {
      let op_tok = this.current_tok;
      res.register_advancement();
      this.advance();
      let right = res.register(func_b());
      if (res.error) return res;

      left = new BinaryOperationNode(left, op_tok, right);
    }
    return res.success(left);
  }
}

module.exports = { Parser };
