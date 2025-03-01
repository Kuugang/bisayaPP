const {
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
  TT_COMMA,
  TT_ARROW,
  TT_NEWLINE,
  TT_EOF,
  TT_NOT,
  TT_BOOLEAN,
  TT_DECREMENT,
  TT_INCREMENT,
} = require("./Token.js");
const { Char, String, Boolean, Number, List } = require("./Value.js");
const { RTError, SemanticError } = require("./Error.js");
const { Context } = require("./Context.js");
const { RTResult } = require("./RTResult.js");

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
    } else if (node.op_tok.type == TT_NOT) {
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
      [number, error] = number.add(new Number(1));
    } else if (node.op_tok.type == TT_DECREMENT) {
      [number, error] = number.subtract(new Number(1));
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
          break;
        }
    }

    if (error) return res.failure(error);
    else return res.success(result.set_pos(node.pos_start, node.pos_end));
  }

  visit_ForNode(node, context) {
    let res = new RTResult();

    res.register(this.visit(node.initialization_node, context));
    if(res.error)return res

    let condition_node = res.register(this.visit(node.condition_node, context));
    if (res.should_return()) return res;

    while (true) {
      condition_node = res.register(this.visit(node.condition_node, context));
      if (res.should_return()) return res;
      if (condition_node.value === "DILI") {
        break;
      }

      res.register(this.visit(node.body_node, context));

      if (
        res.should_return() &&
        res.loop_should_continue == false &&
        res.loop_should_break == false
      ) {
        return res;
      }

      if (res.loop_should_continue) continue;

      if (res.loop_should_break) break;

      res.register(this.visit(node.update_node, context));
      if (res.should_return()) return res;
    }

    return res.success(
      new Number(null),
    );
  }

  visit_WhileNode(node, context) {
    let res = new RTResult();

    while (true) {
        let condition_node = res.register(this.visit(node.condition_node, context));

        if (res.should_return()) return res;
        if (condition_node.value === "DILI") {
            break;
        }
    
        res.register(this.visit(node.body_node, context));
    
        if (
            res.should_return() &&
            res.loop_should_continue == false &&
            res.loop_should_break == false
        ) {
            return res;
        }
    
        if (res.loop_should_continue) continue;
    
        if (res.loop_should_break) break;
    }
    return res.success(new Number(null));
  }

  visit_ListNode(node, context) {
    let res = new RTResult();
    let elements = [];
    for (let element_node of node.element_nodes) {
      let value = res.register(this.visit(element_node, context));

      if (res.should_return()) return res; // Exit function immediately

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

    if(variable === null && node.type === null){
        return res.failure(
            new RTError(
                node.pos_start,
                node.pos_end,
                `Variable '${var_name}' is not defined`,
                context,
            ),
        );
    }

    if (variable && node.type !== null && context === variable.context) {
        return res.failure(
          new RTError(
            variable.pos_start,
            variable.pos_end,
            `Variable '${var_name}' is previously defined here`,
            context,
          ),
        );
    }

    let value = null;
    if (node.value_node) {
      value = res.register(this.visit(node.value_node, context));
      if (res.should_return()) return res;

      if(node.type === TT_BOOLEAN){
        if(value.value !== "OO" && value.value !== "DILI"){
          return res.failure(
            new SemanticError(
              value.pos_start,
              value.pos_end,
              `Expected ${node.type} received ${value.type}`,
              context,
            ),
          );
        }
        value = new Boolean(value.value);
      }

      if (
        [TT_FLOAT, TT_INT].includes(node.type) &&
        !(value instanceof Number)
      ) {
        return res.failure(
          new SemanticError(
            value.pos_start,
            value.pos_end,
            `Expected ${node.type} received ${value.type}`,
            context,
          ),
        );
      }

      if (node.type === TT_LETRA && !(value instanceof Char)) {
        return res.failure(
          new SemanticError(
            value.pos_start,
            value.pos_end,
            `Expected ${node.type} received ${value.type}`,
            context,
          ),
        );
      }
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

  visit_Block(node, context){
    let res = new RTResult();
    let value = null;

    let new_context = new Context(node.name, context, node.pos_start);
    new_context.symbol_table = context.symbol_table;

    for(let child of node.statements){
      value = res.register(this.visit(child, new_context));
      if(res.should_return()) return res;
    }
    return res.success(value);
  }

  visit_BreakNode(node, context){
    if(context.display_name !== "<loop>"){
        return new RTResult().failure(
            new RTError(
            node.pos_start,
            node.pos_end,
            "Break statement outside loop or switch",
            context,
            ),
        );
    }
    return new RTResult().success_break();
  }

  visit_ContinueNode(node, context){
    if(context.display_name !== "<loop>"){
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

  visit_FuncDefNode(node, context){
    let res = new RTResult();
    let func_name = node.var_name_tok.value;
    let body_node = node.body_node;
    let args = node.args
    let return_type = node.return_type

    const { Function } = require("./Function.js");
    let func_value = new Function(func_name, body_node, args, return_type).set_context(
      context,
    );

    context.symbol_table.set(func_name, func_value);
    return res.success(func_value);
  }

  visit_ReturnNode(node, context){
    let res = new RTResult();
    let value = null;
    if(node.node_to_return){
      value = res.register(this.visit(node.node_to_return, context));
      if(res.should_return()) return res;
    }

    return res.success_return(value);
  }
}

module.exports = { RTResult, Interpreter };