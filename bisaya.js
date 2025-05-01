const fs = require("fs");
const { BuiltInFunction } = require("./Function.js");
const { Lexer } = require("./Lexer.js");
const { Parser } = require("./Parser.js");
const { Interpreter } = require("./Interpreter.js");
const { Context } = require("./Context.js");
const { SymbolTable } = require("./SymbolTable.js");

const args = process.argv;

if (args[2] === undefined) {
  console.error("Provide input file");
  return;
}

const file_name = args[2];

let global_symbol_table = new SymbolTable();
global_symbol_table.set("PRINT", BuiltInFunction.print);
global_symbol_table.set("MATH_RANDOM", BuiltInFunction.math_random);
global_symbol_table.set("MATH_FLOOR", BuiltInFunction.math_floor);

function run(fn, text) {
  let lexer = new Lexer(fn, text);
  let [tokens, error] = lexer.make_tokens();

  if (error) return [null, error];

  let parser = new Parser(tokens);
  ast = parser.parse();
  if (ast.error) return [null, ast.error];
  // visualize_tree(ast.node);

  let interpreter = new Interpreter();
  let context = new Context("<program>");
  context.symbol_table = global_symbol_table;

  result = interpreter.visit(ast.node, context);
  if (!result.error) console.log("\nNO ERROR");
  return [result.value, result.error];
}

fs.readFile(file_name, "utf8", (err, script) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  const [result, error] = run("<program>", script);

  if (error) {
    console.log(error.as_string());
  } else if (result) {
    // if (result.elements.length == 1) console.log(String(result.elements[0]));
    // else console.log(String(result));
  }
});

function visualize_tree(node) {
  for (let a of node.element_nodes) {
    console.log(a.toString());
  }
}
