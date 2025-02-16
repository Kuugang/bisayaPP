const { Value, Number } = require("./Value.js");
const { Context } = require("./Context.js");
const { RTResult } = require("./Interpreter.js");
const { SymbolTable } = require("./SymbolTable.js");
const { RTError } = require("./Error.js");
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
      let arg_name = arg_names[i];
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
    console.log(String(exec_ctx.symbol_table.get("value")));
    return new RTResult().success(new Number(0));
  }
}

BuiltInFunction.prototype.execute_print.arg_names = ["value"];
BuiltInFunction.print = new BuiltInFunction("print");

module.exports = { BuiltInFunction };
