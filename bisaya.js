const fs = require("fs");
const { Lexer } = require("./Lexer.js");
const { Parser } = require("./Parser.js");
const { Interpreter } = require("./Interpreter.js");
const { Context } = require("./Context.js");

const { SymbolTable } = require("./SymbolTable.js");
const { BuiltInFunction } = require("./Function.js");

const prompt = require("prompt-sync")();

let global_symbol_table = new SymbolTable();
global_symbol_table.set("PRINT", BuiltInFunction.print);

function run(fn, text) {
  let lexer = new Lexer(fn, text);
  let [tokens, error] = lexer.make_tokens();

  if (error) return [null, error];

  let parser = new Parser(tokens);
  ast = parser.parse();
  if (ast.error) return [null, ast.error];

  let interpreter = new Interpreter();
  let context = new Context("<program>");
  context.symbol_table = global_symbol_table;

  result = interpreter.visit(ast.node, context);
  return [result.value, result.error];
}

fs.readFile("main.test", "utf8", (err, script) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  const [result, error] = run("<program>", script);

  if (error) {
    console.log(error.as_string());
  } else if (result) {
    // console.log(result);
    // if (result.elements.length == 1) console.log(String(result.elements[0]));
    // else console.log(String(result));
  }
});

// while (true) {
//   let text = prompt("Bisaya ni bai> ");
//   const [result, error] = run("<program>", text);
//
//   if (error) {
//     console.log(error.as_string());
//   } else {
//     // console.log(result.join("\n"));
//     console.log(result);
//   }
// }
