const { Value, Number } = require("./Value");
const { RTResult } = require("./RTResult");
const { Interpreter } = require("./Interpreter");
const { Context } = require("./Context");
const { SymbolTable } = require("./SymbolTable");
const { RTError, TypeError } = require("./Error");
class BaseFunction extends Value {
  constructor(name) {
    super();
    this.name = name || "<anonymous>";
    this.type = "LIHOK";
  }

  generate_new_context() {
    let new_context = new Context(this.name, this.context, this.pos_start);
    new_context.symbol_table = new SymbolTable(new_context.parent.symbol_table);
    return new_context;
  }
  check_args(arg_names, args) {
    let res = new RTResult();

    // Check argument count
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

    // Check argument types
    for (let i = 0; i < arg_names.length; i++) {
      // Skip type check if the argument type is null (accepts any type)
      if (arg_names[i].type !== null) {
        // Handle union types
        if (arg_names[i].type.union) {
          if (!arg_names[i].type.union.includes(args[i].type)) {
            return res.failure(
              new TypeError(
                args[i].pos_start || this.pos_start,
                args[i].pos_end || this.pos_end,
                `Expected one of [${arg_names[i].type.union.join(", ")}] but got ${args[i].type}`,
                this.context,
              ),
            );
          }
        }
        // Handle single type
        else if (args[i].type !== arg_names[i].type) {
          return res.failure(
            new TypeError(
              args[i].pos_start || this.pos_start,
              args[i].pos_end || this.pos_end,
              `Expected ${arg_names[i].type} but got ${args[i].type}`,
              this.context,
            ),
          );
        }
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

  execute_math_random(exec_ctx) {
    return new RTResult().success(new Number(Math.random(), "TIPIK"));
  }

  execute_math_floor(exec_ctx) {
    const value = exec_ctx.symbol_table.get("value");

    // Handle NUMERO type directly
    if (value.type === "NUMERO") {
      return new RTResult().success(new Number(Math.floor(value.value)));
    }
    // Handle TIPIK type with conversion
    else if (value.type === "TIPIK") {
      // Try to convert TIPIK to NUMERO
      const numValue = parseFloat(value.value);
      if (!isNaN(numValue)) {
        return new RTResult().success(new Number(Math.floor(numValue)));
      } else {
        return new RTResult().failure(
          new TypeError(
            this.pos_start,
            this.pos_end,
            `Cannot convert TIPIK '${value.value}' to NUMERO for math_floor`,
            exec_ctx,
          ),
        );
      }
    }
    // Should not reach here due to type checking in check_args, but as a fallback
    else {
      return new RTResult().failure(
        new TypeError(
          this.pos_start,
          this.pos_end,
          `Expected NUMERO or TIPIK but got ${value.type}`,
          exec_ctx,
        ),
      );
    }
  }
}

class Function extends BaseFunction {
  constructor(node) {
    super(node.name);
    this.node = node;
    this.body_node = node.body_node;
    this.args = node.args;
    this.return_type = node.return_type;
  }

  execute(args, context) {
    let res = new RTResult();
    let interpreter = new Interpreter();
    context = this.generate_new_context();

    res.register(this.check_and_populate_args(this.args, args, context));
    if (res.should_return()) return res;
    let value = res.register(interpreter.visit(this.body_node, context));
    if (res.should_return() && res.func_return_value === null) return res;

    if (
      !this.return_type &&
      res.func_return_value &&
      res.func_return_value.type
    ) {
      return res.failure(
        new RTError(
          this.pos_start,
          this.pos_end,
          `return-statement with a value, in function returning 'void'`,
          this.context,
        ),
      );
    }

    //TODO FIX should not throw an error when return type if int and returned value type is float and vice versa
    if (res.func_return_value.type !== this.return_type) {
      return res.failure(
        new TypeError(
          res.func_return_value.return_node.pos_start,
          res.func_return_value.return_node.pos_end,
          `Expected return type of ${this.return_type} but got ${res.func_return_value.type}`,
          context,
        ),
      );
    }

    let retValue = res.func_return_value || new Number(0);
    return res.success(retValue);
  }

  copy() {
    let copy = new Function(this.node);
    copy.set_context(this.context);
    copy.set_pos(this.pos_start, this.pos_end);
    return copy;
  }

  toString() {
    return `<function ${this.name}>`;
  }
}

BuiltInFunction.prototype.execute_print.arg_names = [
  { name: { value: "value" }, type: null },
];
BuiltInFunction.prototype.execute_math_random.arg_names = [];

BuiltInFunction.prototype.execute_math_floor.arg_names = [
  {
    name: { value: "value" },
    type: { union: ["TIPIK", "NUMERO"] },
  },
];

BuiltInFunction.print = new BuiltInFunction("print");

BuiltInFunction.math_random = new BuiltInFunction("math_random");

BuiltInFunction.math_floor = new BuiltInFunction("math_floor");

module.exports = { BuiltInFunction, Function };
