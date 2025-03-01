const { Token, TT_IDENTIFIER } = require("./Token");


class VarAssignNode {
  constructor(type = null, var_name_tok, value_node = null) {
    this.type = type;
    this.var_name_tok = var_name_tok;
    this.value_node = value_node;

    this.pos_start = this.var_name_tok.pos_start;
    this.pos_end = value_node
      ? this.value_node.pos_end
      : this.var_name_tok.pos_end;
  }
}

class VarAccessNode {
  constructor(var_name_tok) {
    this.var_name_tok = var_name_tok;

    this.pos_start = this.var_name_tok.pos_start;
    this.pos_end = this.var_name_tok.pos_end;
  }
}

class CharNode {
  constructor(tok) {
    this.tok = tok;
    this.pos_start = this.tok.pos_start;
    this.pos_end = this.tok.pos_end;
  }

  toString() {
    return this.tok + "";
  }
}
class BooleanNode {
  constructor(tok) {
    this.tok = tok;
    this.pos_start = this.tok.pos_start;
    this.pos_end = this.tok.pos_end;
    this.type = "TINUOD";
  }

  toString() {
    return this.tok + "";
  }
}

class StringNode {
  constructor(tok) {
    this.tok = tok;
    this.pos_start = this.tok.pos_start;
    this.pos_end = this.tok.pos_end;
  }

  toString() {
    return this.tok + "";
  }
}

class NumberNode {
  constructor(tok, type) {
    this.tok = tok;
    this.type = type;

    this.pos_start = this.tok.pos_start;
    this.pos_end = this.tok.pos_end;
  }

  toString() {
    return this.tok + "";
  }
}

class UnaryOperationNode {
  constructor(op_tok, node) {
    this.op_tok = op_tok;
    this.node = node;

    this.pos_start = this.op_tok.pos_start;
    this.pos_end = this.node.pos_end;
  }
}

class PostfixOperationNode {
  constructor(node, op_tok) {
    this.node = node;
    this.op_tok = op_tok;

    this.pos_start = this.node.pos_start;
    this.pos_end = this.op_tok.pos_end;
  }
}

class ForNode {
  constructor(
    initialization_node,
    condition_node,
    update_node,
    body_node,
    should_return_null,
  ) {
    this.initialization_node = initialization_node;

    this.condition_node = condition_node;
    this.update_node = update_node;
    this.body_node = body_node;
    this.should_return_null = should_return_null;

    this.pos_start = this.initialization_node.pos_start;
    this.pos_end = this.body_node.pos_end;
  }
}

class WhileNode{
    constructor(condition_node, body_node){
        this.condition_node = condition_node;
        this.body_node = body_node;
        this.pos_start = this.condition_node.pos_start;
        this.pos_end = this.body_node.pos_end;
    }
}

class ListNode {
  constructor(element_nodes, pos_start, pos_end) {
    this.element_nodes = element_nodes;
    this.pos_start = pos_start;
    this.pos_end = pos_end;
  }
  toString() {
    return this.element_nodes.join(" ");
  }
}
class BinaryOperationNode {
  constructor(left_node, op_tok, right_node) {
    this.left_node = left_node;
    this.op_tok = op_tok;
    this.right_node = right_node;

    this.pos_start = this.left_node.pos_start;
    this.pos_end = this.right_node.pos_end;
  }

  toString() {
    return `(${this.left_node}, ${this.op_tok}, ${this.right_node})`;
  }
}
class PrintNode {
  constructor(pos_start, arg_nodes) {
    this.arg_nodes = arg_nodes;
    this.pos_start = pos_start;
    this.pos_end = arg_nodes[arg_nodes.length - 1].pos_end;
  }
}

class Block{
    constructor(statements, name = "<block>", pos_start, pos_end){
        this.statements = statements;
        this.name = name;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}

class BreakNode{
    constructor(pos_start, pos_end){
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}
class ContinueNode{
    constructor(pos_start, pos_end){
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}



class FuncDefNode{
    constructor(var_name_tok, args, body_node, return_type){
        this.var_name_tok = var_name_tok;
        this.args = args;
        this.body_node = body_node;
        this.return_type = return_type;

        this.pos_start = this.var_name_tok.pos_start;
        this.pos_end = this.body_node.pos_end;
    }
}
class CallNode {
  constructor(node_to_call, arg_nodes) {
    this.node_to_call = node_to_call;
    this.arg_nodes = arg_nodes;

    this.pos_start = this.node_to_call.pos_start;

    if (this.arg_nodes.length > 0)
      this.pos_end = this.arg_nodes[this.arg_nodes.length - 1].pos_end;
    else this.pos_end = this.node_to_call.pos_end;
  }
}

class ReturnNode{
    constructor(node_to_return, pos_start, pos_end){
        this.node_to_return = node_to_return;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }
}


module.exports = {
  VarAssignNode,
  VarAccessNode,
  CharNode,
  StringNode,
  BooleanNode,
  NumberNode,
  UnaryOperationNode,
  PostfixOperationNode,
  ForNode,
  WhileNode,
  ListNode,
  BinaryOperationNode,
  PrintNode,
  Block,
  BreakNode,
  ContinueNode,
  FuncDefNode,
  CallNode,
  ReturnNode
};
