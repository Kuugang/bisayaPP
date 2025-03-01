const { Value, Number } = require("./Value");
const { RTResult } = require("./RTResult");
const {Interpreter} = require("./Interpreter");
const { Context } = require("./Context");
const { SymbolTable } = require("./SymbolTable");
const { RTError } = require("./Error");
class BaseFunction extends Value {
  constructor(name) {
    super();
    this.name = name || "<anonymous>";
  }

  generate_new_context() {
    let new_context = new Context(this.name, this.context, this.pos_start);
    new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
    return new_context;
  }

  check_args(arg_names, args) {
    let res = new RTResult();

    if (args.length > arg_names.length) {
      return res.failure(
        new RTError(
          this.pos_start,
          this.pos_end,
          `${args.length - arg_names.length} too many args passed into ${this}`,
          this.context,
        ),
      );
    }

    if (args.length < arg_names.length) {
      return res.failure(
        new RTError(
          this.pos_start,
          this.pos_end,
          `${arg_names.length - args.length} too few args passed into ${this}`,
          this.context,
        ),
      );
    }

    for (let i = 0; i < arg_names.length; i++) {
        if(arg_names[i].type != args[i].type){
            return res.failure(
                new RTError(
                    args[i].pos_start,
                    args[i].pos_end,
                    `Expected ${arg_names[i].type} but got ${args[i].type}`,
                    this.context,
                ),
            );
        }
    }

    for (let i = 0; i < arg_names.length; i++) {
      if (args[i] == null) {
        return res.failure(
          new RTError(
            this.pos_start,
            this.pos_end,
            `'${args[i]}' is not defined`,
            this.context,
          ),
        );
      }
    }

    return res.success(null);
  }

  populate_args(arg_names, args, exec_ctx) {
    for (let i = 0; i < args.length; i++) {
      let arg_name = arg_names[i].name.value;
      let arg_value = args[i];
      arg_value.set_context(exec_ctx);
      exec_ctx.symbol_table.set(arg_name, arg_value);
    }
  }

  check_and_populate_args(arg_names, args, exec_ctx) {
    let res = new RTResult();
    res.register(this.check_args(arg_names, args));
    if (res.should_return()) return res;
    this.populate_args(arg_names, args, exec_ctx);
    return res.success(null);
  }
}

class BuiltInFunction extends BaseFunction {
  constructor(name) {
    super(name);
  }

  execute(args) {
    let res = new RTResult();
    let exec_ctx = this.generate_new_context();

    let methodName = `execute_${this.name}`;
    let method = this[methodName] || this.noVisitMethod;

    res.register(
      this.check_and_populate_args(method.arg_names, args, exec_ctx),
    );
    if (res.should_return()) return res;

    let return_value = res.register(method.call(this, exec_ctx));
    if (res.should_return()) return res;
    return res.success(return_value);
  }

  no_visit_method(node, context) {
    throw new Error(`No execute_${this.name} method defined`);
  }

  copy() {
    let copy = new BuiltInFunction(this.name);
    copy.set_context(this.context);
    copy.set_pos(this.pos_start, this.pos_end);
    return copy;
  }

  toString() {
    return `<built-in function ${this.name}>`;
  }

  execute_print(exec_ctx) {
    //process.stdout.write(String(exec_ctx.symbol_table.get("value")));
    console.log(String(exec_ctx.symbol_table.get("value")));
    return new RTResult().success(new Number(0));
  }
}


class Function extends BaseFunction{
  constructor(name, body_node, args, return_type) {
    super(name)
    this.body_node = body_node
    this.args = args
    this.return_type = return_type
  }

  execute(args, context) {
    let res = new RTResult();
    let interpreter = new Interpreter();
    //let exec_ctx = this.generate_new_context();

    res.register(this.check_and_populate_args(this.args, args, context));
    if (res.should_return()) return res;

    let value = res.register(interpreter.visit(this.body_node, context));
    if (res.should_return() && res.func_return_value === null) return res;

    if(!this.return_type && res.func_return_value.type){
        return res.failure(
            new RTError(
                this.pos_start,
                this.pos_end,
                `return-statement with a value, in function returning 'void'`,
                this.context,
            ),
        );
    }

    if(this.return_type && res.func_return_value && this.return_type != res.func_return_value.type){
        return res.failure(
            new RTError(
                this.pos_start,
                this.pos_end,
                `Expected return type of ${this.return_type} but got ${res.func_return_value.type}`,
                this.context,
            ),
        );
    }
    
    let retValue = res.func_return_value || new Number(0);
    return res.success(retValue);
  }

  copy() {
    let copy = new Function(this.name, this.body_node, this.args, this.return_type);
    copy.set_context(this.context);
    copy.set_pos(this.pos_start, this.pos_end);
    return copy;
  }

  toString() {
    return `<function ${this.name}>`;
  }
}

BuiltInFunction.prototype.execute_print.arg_names = ["value"];
BuiltInFunction.print = new BuiltInFunction("print");

module.exports = { BuiltInFunction, Function };