const {
  TT_INT,
  TT_FLOAT,
  TT_LETRA,
  TT_STRING,
  TT_KEYWORD,
  TT_PLUS,
  TT_MINUS,
  TT_MUL,
  TT_DIV,
  TT_MOD,
  TT_POW,
  TT_EE,
  TT_NE,
  TT_LT,
  TT_GT,
  TT_LTE,
  TT_GTE,
  TT_NOT,
  TT_BOOLEAN,
  TT_DECREMENT,
  TT_INCREMENT,
  TT_CONCAT,
} = require("./Token.js");
const { Char, String, Boolean, Number, List } = require("./Value.js");
const { RTError, TypeError } = require("./Error.js");
const { Context } = require("./Context.js");
const { RTResult } = require("./RTResult.js");

var readlineSync = require("readline-sync");
const {
  VarAccessNode,
  FuncDefNode,
  CallNode,
  BreakNode,
} = require("./Node.js");
const { SymbolTable } = require("./SymbolTable.js");

const throwTypeError = (node, expected, received, context) => {
  return new RTResult().failure(
    new TypeError(
      node.pos_start,
      node.pos_end,
      `Expected ${expected}, but received ${received}`,
      context,
    ),
  );
};

class Interpreter {
  visit(node, context) {
    if (node === null) return [null, null];
    let methodName = `visit_${node.constructor.name}`;
    let method = this[methodName] || this.no_visit_method;
    let result = method.call(this, node, context);
    return result;
  }

  no_visit_method(node, context) {
    throw new Error(`No visit_${node.constructor.name} method defined`);
  }

  visit_NumberNode(node, context) {
    return new RTResult().success(
      new Number(node.tok.value, node.type)
        .set_context(context)
        .set_pos(node.pos_start, node.pos_end),
    );
  }

  visit_CharNode(node, context) {
    return new RTResult().success(
      new Char(node.tok.value)
        .set_context(context)
        .set_pos(node.pos_start, node.pos_end),
    );
  }

  visit_BooleanNode(node, context) {
    let value;
    if (node.tok.value == "OO") {
      value = "OO";
    } else if (node.tok.value == "DILI") {
      value = "DILI";
    }

    return new RTResult().success(
      new Boolean(value)
        .set_context(context)
        .set_pos(node.pos_start, node.pos_end),
    );
  }

  visit_StringNode(node, context) {
    return new RTResult().success(
      new String(node.tok.value)
        .set_context(context)
        .set_pos(node.pos_start, node.pos_end),
    );
  }

  visit_UnaryOperationNode(node, context) {
    let res = new RTResult();
    let number = res.register(this.visit(node.node, context));
    if (res.should_return()) return res;

    let error = null;

    if (node.op_tok.type == TT_MINUS) {
      [number, error] = number.multiply(new Number(-1));
    } else if (node.op_tok.matches(TT_KEYWORD, "DILI")) {
      [number, error] = number.notted();
    }

    if (error) return res.failure(error);
    else return res.success(number.set_pos(node.pos_start, node.pos_end));
  }

  visit_PostfixOperationNode(node, context) {
    let res = new RTResult();
    let number = res.register(this.visit(node.node, context));
    if (res.should_return()) return res;

    let error = null;

    let originalValue = number.copy();

    if (node.op_tok.type == TT_INCREMENT) {
      [number, error] = number.add(
        new Number(1, "NUMERO")
          .set_context(context)
          .set_pos(node.pos_start, node.pos_end),
      );
    } else if (node.op_tok.type == TT_DECREMENT) {
      [number, error] = number.subtract(
        new Number(1, "NUMERO")
          .set_context(context)
          .set_pos(node.pos_start, node.pos_end),
      );
    }

    if (error) return res.failure(error);

    context.symbol_table.set(node.node.var_name_tok.value, number);

    return res.success(originalValue.set_pos(node.pos_start, node.pos_end));
  }

  visit_BinaryOperationNode(node, context) {
    let res = new RTResult();

    let left = res.register(this.visit(node.left_node, context));
    if (res.should_return()) return res;

    let right = res.register(this.visit(node.right_node, context));
    if (res.should_return()) return res;

    let [result, error] = [null, null];

    switch (node.op_tok.type) {
      case TT_PLUS:
        [result, error] = left.add(right);
        break;
      case TT_MINUS:
        [result, error] = left.subtract(right);
        break;
      case TT_MUL:
        [result, error] = left.multiply(right);
        break;
      case TT_DIV:
        [result, error] = left.divide(right);
        break;
      case TT_POW:
        [result, error] = left.power(right);
        break;
      case TT_EE:
        [result, error] = left.eq(right);
        break;
      case TT_NE:
        [result, error] = left.ne(right);
        break;
      case TT_LT:
        [result, error] = left.lt(right);
        break;
      case TT_GT:
        [result, error] = left.gt(right);
        break;
      case TT_LTE:
        [result, error] = left.lte(right);
        break;
      case TT_GTE:
        [result, error] = left.gte(right);
        break;
      case TT_MOD:
        [result, error] = left.modulo(right);
        break;
      case TT_KEYWORD:
        if (node.op_tok.matches(TT_KEYWORD, "UG")) {
          [result, error] = left.and(right);
        } else if (node.op_tok.matches(TT_KEYWORD, "O")) {
          [result, error] = left.or(right);
        }
        break;
      case TT_CONCAT:
        [result, error] = left.concat(right);
        break;
    }

    if (error) return res.failure(error);
    else return res.success(result.set_pos(node.pos_start, node.pos_end));
  }

  visit_ForNode(node, context) {
    let res = new RTResult();

    let new_context = new Context(node.name, context, node.pos_start);
    new_context.symbol_table = new SymbolTable(context.symbol_table);

    res.register(this.visit(node.initialization_node, new_context));
    if (res.error) return res;

    let condition_node = res.register(
      this.visit(node.condition_node, new_context),
    );
    if (res.should_return()) return res;

    let symbol_table = new_context.symbol_table;

    while (true) {
      new_context.symbol_table = symbol_table;
      condition_node = res.register(
        this.visit(node.condition_node, new_context),
      );
      if (res.should_return()) return res;
      if (condition_node.value === "DILI") {
        break;
      }

      res.register(this.visit(node.body_node, new_context));

      if (
        res.should_return() &&
        res.loop_should_continue == false &&
        res.loop_should_break == false
      ) {
        return res;
      }

      if (res.loop_should_continue) continue;

      if (res.loop_should_break) break;

      res.register(this.visit(node.update_node, new_context));
      if (res.should_return()) return res;
      symbol_table = new SymbolTable(symbol_table);
    }

    return res.success(new Number(null));
  }

  visit_WhileNode(node, context) {
    let res = new RTResult();

    let new_context = new Context(node.name, context, node.pos_start);
    new_context.symbol_table = new SymbolTable(context.symbol_table);

    let symbol_table = new_context.symbol_table;

    while (true) {
      new_context.symbol_table = symbol_table;
      let condition_node = res.register(
        this.visit(node.condition_node, new_context),
      );

      if (res.should_return()) return res;
      if (condition_node.value === "DILI") {
        break;
      }

      res.register(this.visit(node.body_node, new_context));

      if (
        res.should_return() &&
        res.loop_should_continue == false &&
        res.loop_should_break == false
      ) {
        return res;
      }

      if (res.loop_should_continue) continue;

      if (res.loop_should_break) break;
      symbol_table = new SymbolTable(symbol_table);
    }
    return res.success(new Number(null));
  }

  visit_DoWhileNode(node, context) {
    let res = new RTResult();

    let new_context = new Context(node.name, context, node.pos_start);
    new_context.symbol_table = new SymbolTable(context.symbol_table);

    let symbol_table = new_context.symbol_table;

    while (true) {
      new_context.symbol_table = symbol_table;

      res.register(this.visit(node.body_node, new_context));

      if (
        res.should_return() &&
        res.loop_should_continue == false &&
        res.loop_should_break == false
      ) {
        return res;
      }

      if (res.loop_should_continue) continue;

      if (res.loop_should_break) break;

      let condition_node = res.register(
        this.visit(node.condition_node, new_context),
      );
      if (res.should_return()) return res;
      if (condition_node.value === "DILI") {
        break;
      }

      symbol_table = new SymbolTable(symbol_table);
    }
    return res.success(new Number(null));
  }

  visit_SwitchNode(node, context) {
    let res = new RTResult();
    let cases = node.cases;
    let literals = node.literals;
    let default_case = node.default_case;
    let expr_value = res.register(this.visit(node.expr, context));
    if (res.should_return()) return res;

    for (let i = 0; i < cases.length; i++) {
      let literal_value = res.register(this.visit(literals[i], context));
      if (res.should_return()) return res;

      let [result, error] = literal_value.eq(expr_value);
      if (error) return res.failure(error);

      if (result.is_true()) {
        let case_context = new Context("<case>", context);
        let symbol_table = new SymbolTable(context.symbol_table);
        case_context.symbol_table = symbol_table;
        res.register(this.visit(cases[i], case_context));

        if (res.should_return_case()) return res;

        for (let j = i + 1; j < cases.length; j++) {
          let case_context = new Context("<case>", context);
          let symbol_table = new SymbolTable(context.symbol_table);
          case_context.symbol_table = symbol_table;

          res.register(this.visit(cases[j], case_context));
          if (res.should_return_case()) return res;
        }
        break;
      }
    }

    if (default_case) {
      let case_context = new Context("<case>", context);
      let symbol_table = new SymbolTable(context.symbol_table);
      case_context.symbol_table = symbol_table;
      res.register(this.visit(default_case, case_context));
      if (res.should_return_case()) return res;
    }
    return res.success(new Number(null));
  }

  visit_ListNode(node, context) {
    let res = new RTResult();
    let elements = [];
    for (let element_node of node.element_nodes) {
      let value = res.register(this.visit(element_node, context));

      if (res.should_return()) return res; // Exit function immediately
      if (res.should_return_case()) return res;

      elements.push(value);
    }
    return res.success(
      new List(elements)
        .set_context(context)
        .set_pos(node.pos_start, node.pos_end),
    );
  }

  visit_VarAssignNode(node, context) {
    let res = new RTResult();
    let var_name = node.var_name_tok.value;
    let variable = context.symbol_table.get(var_name);
    let value = null;

    // if (node.value_node && node.value_node instanceof CallNode) {
    //   return res.failure(
    //     new RTError(
    //       node.value_node.pos_start,
    //       node.value_node.pos_end,
    //       `${node.value_node.node_to_call.var_name_tok.value} cannot be used as a function`,
    //       context,
    //     ),
    //   );
    // }

    if (
      node.assign_type === "definition" &&
      context.symbol_table.get_current(var_name)
    ) {
      return res.failure(
        new RTError(
          node.pos_start,
          node.pos_end,
          `Variable '${var_name}' is previously defined`,
          context,
        ),
      );
    }

    if (node.assign_type === "reassign") {
      value = res.register(this.visit(node.value_node, context));
      if (res.should_return()) return res;

      value.set_context(variable.context);

      if (node.type === TT_BOOLEAN) {
        if (value.value !== "OO" && value.value !== "DILI")
          return throwTypeError(value, node.type, value.type, context);

        // KAY BASIN STRING NGA "OO" OR "DILI"
        value = new Boolean(value.value);
      }

      if ([TT_FLOAT, TT_INT].includes(node.type) && !(value instanceof Number))
        return throwTypeError(value, node.type, value.type, context);

      if (node.type === TT_LETRA && !(value instanceof Char))
        return throwTypeError(value, node.type, value.type, context);

      if (
        node.type === TT_STRING &&
        !(value instanceof String || value instanceof Char)
      )
        return throwTypeError(value, node.type, value.type, context);

      if (variable === null) {
        return res.failure(
          new RTError(
            node.pos_start,
            node.pos_end,
            `Variable '${var_name}' is not defined`,
            context,
          ),
        );
      }
      if (variable.context === null) variable.context = context;
      variable.context.symbol_table.set(var_name, value);
      return res.success(value);
    }

    if (node.value_node) {
      value = res.register(this.visit(node.value_node, context));
      if (res.should_return()) return res;

      if (node.type === TT_BOOLEAN) {
        if (value.value !== "OO" && value.value !== "DILI")
          return throwTypeError(value, node.type, value.type, context);

        // KAY BASIN STRING NGA "OO" OR "DILI"
        value = new Boolean(value.value);
      }

      if ([TT_FLOAT, TT_INT].includes(node.type) && !(value instanceof Number))
        return throwTypeError(value, node.type, value.type, context);

      if (node.type === TT_LETRA && !(value instanceof Char))
        return throwTypeError(value, node.type, value.type, context);

      if (
        node.type === TT_STRING &&
        !(value instanceof String || value instanceof Char)
      )
        return throwTypeError(value, node.type, value.type, context);
    } else {
      switch (node.type) {
        case TT_INT:
        case TT_FLOAT:
          value = new Number(null, node.type);
          break;
        case TT_BOOLEAN:
          value = new Boolean(null);
          break;
        case TT_LETRA:
          value = new Char(null);
          break;
        case TT_STRING:
          value = new String(null);
          break;
      }
      value = value.set_pos(node.pos_start, node.pos_end).set_context(context);
    }

    context.symbol_table.set(var_name, value);
    return res.success(value);
  }

  visit_VarAccessNode(node, context) {
    let res = new RTResult();
    let var_name = node.var_name_tok.value;
    let value = context.symbol_table.get(var_name);

    if (!value) {
      return res.failure(
        new RTError(
          node.pos_start,
          node.pos_end,
          `'${var_name}' is not defined`,
          context,
        ),
      );
    }

    value = value
      .copy()
      .set_pos(node.pos_start, node.pos_end)
      .set_context(context);
    return res.success(value);
  }

  visit_CallNode(node, context) {
    let res = new RTResult();
    let args = [];
    let value_to_call = res.register(this.visit(node.node_to_call, context));

    if (res.should_return()) return res;
    value_to_call = value_to_call.copy().set_pos(node.pos_start, node.pos_end);

    for (let arg_node of node.arg_nodes) {
      args.push(res.register(this.visit(arg_node, context)));
      if (res.should_return()) return res;
    }

    let return_value = res.register(value_to_call.execute(args, context));
    if (res.should_return()) return res;

    return_value = return_value
      .copy()
      .set_pos(node.pos_start, node.pos_end)
      .set_context(context);
    return res.success(return_value);
  }

  visit_PrintNode(node, context) {
    let res = new RTResult();
    let args = node.arg_nodes;
    let value = "";
    for (let i = 0; i < args.length; i++) {
      let arg_value = res.register(this.visit(args[i], context));
      if (res.should_return()) return res;
      value += arg_value.value;
    }
    value += "\0";
    process.stdout.write(value);
    return res.success(new Number(0));
  }

  visit_IfNode(node, context) {
    let res = new RTResult();
    let cases = node.cases;

    for (let c of cases) {
      let value = res.register(this.visit(c[0], context));
      if (res.should_return()) return res;

      if (value.is_true()) {
        res.register(this.visit(c[1], context));
        if (res.should_return()) return res;
        return res.success(new Number(0));
      }
    }
    if (node.else_case) {
      res.register(this.visit(node.else_case, context));
      if (res.should_return()) return res;
    }
    return res.success(new Number(0));
  }

  visit_InputNode(node, context) {
    let res = new RTResult();
    let var_toks = node.var_toks;

    for (let i = 0; i < var_toks.length; i++) {
      let value_node = res.register(
        this.visit(new VarAccessNode(var_toks[i]), context),
      );
      if (res.error) return res;
      let input = readlineSync.question();

      switch (value_node.type) {
        case "PULONG":
          value_node = new String(input);
          break;

        case "LETRA":
          if (input.length > 1) {
            return res.failure(
              new TypeError(
                var_toks[i].pos_start,
                var_toks[i].pos_end,
                `Unexpected input for type LETRA got '${input}'`,
                context,
              ),
            );
          }
          value_node = new Char(input);
          break;
        case "NUMERO":
          if (!/^-?\d+(\.\d*)?$/.test(input.trim())) {
            return res.failure(
              new TypeError(
                var_toks[i].pos_start,
                var_toks[i].pos_end,
                `Unexpected input for type NUMERO got '${input}'`,
                context,
              ),
            );
          }

          value_node = new Number(parseInt(input));
          break;
        case "TIPIK":
          if (!/^-?\d+(\.\d*)?$/.test(input.trim())) {
            return res.failure(
              new TypeError(
                var_toks[i].pos_start,
                var_toks[i].pos_end,
                `Unexpected input for type DILI got '${input}'`,
                context,
              ),
            );
          }
          value_node = new Number(parseFloat(input));
          break;
        case "TINUOD":
          if (!["OO", "DILI"].includes(input)) {
            return res.failure(
              new TypeError(
                var_toks[i].pos_start,
                var_toks[i].pos_end,
                `Unexpected input for type TINUOD got '${input}'`,
                context,
              ),
            );
          }
          value_node = new Boolean(input);
          break;
      }
      context.symbol_table.set(var_toks[i].value, value_node);
    }

    return res.success(new Number(0));
  }

  visit_Block(node, context) {
    let res = new RTResult();
    let value = null;

    if (node.new_context) {
      let new_context = new Context(node.name, context, node.pos_start);
      new_context.symbol_table = new SymbolTable(context.symbol_table);
      context = new_context;
    }

    for (let child of node.statements) {
      value = res.register(this.visit(child, context));
      if (res.should_return()) return res;
    }
    return res.success(value);
  }

  visit_BreakNode(node, context) {
    if (!["<loop>", "<case>"].includes(context.display_name)) {
      return new RTResult().failure(
        new RTError(
          node.pos_start,
          node.pos_end,
          "Break statement outside loop or switch",
          context,
        ),
      );
    }

    if (context.display_name === "<loop>") {
      return new RTResult().success_break();
    } else if (context.display_name === "<case>") {
      return new RTResult().success_switch_break();
    }
  }

  visit_ContinueNode(node, context) {
    if (context.display_name !== "<loop>") {
      return new RTResult().failure(
        new RTError(
          node.pos_start,
          node.pos_end,
          "Continue statement outside loop",
          context,
        ),
      );
    }
    return new RTResult().success_continue();
  }

  visit_FuncDefNode(node, context) {
    let res = new RTResult();
    let func_name = node.var_name_tok.value;

    const { Function } = require("./Function.js");
    let func_value = new Function(node)
      .set_context(context)
      .set_pos(node.pos_start, node.pos_end);

    context.symbol_table.set(func_name, func_value);
    return res.success(func_value);
  }

  visit_ReturnNode(node, context) {
    let res = new RTResult();
    let value = null;
    if (node.node_to_return) {
      value = res.register(this.visit(node.node_to_return, context));
      value.return_node = node;
      if (res.should_return()) return res;
    }
    return res.success_return(value);
  }
}

module.exports = { RTResult, Interpreter };
