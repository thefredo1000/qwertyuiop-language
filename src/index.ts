#!/usr/bin/env node

import Semantics from "./intermediate";
import VirtualMachine from "./virtualmachine";

const program = require("commander");

program
  .option("-dt --debugtables", "outputs the debug tables for qwertyuiop")
  .option("-q --quadruples", "outputs the quadruples tables for qwertyuiop")
  .parse(process.argv);
  

const debugMode : boolean = program.rawArgs.includes("-dt") || program.rawArgs.includes("--debugtables")
const showQuadruples : boolean = program.rawArgs.includes("-q") || program.rawArgs.includes("--showquadruples")

// myparser.js
var fs = require("fs");
var jison = require("jison");

var bnf = fs.readFileSync("src/grammar.jison", "utf8");

var parser = new jison.Parser(bnf);
var source = fs.readFileSync(process.argv.slice(2)[0], "utf8");

const semantics: Semantics = new Semantics();
parser.yy.data = {
  semantics,
};

const tempConsole = console.log;

console.log = function() {}
parser.generate();

console.log = tempConsole;
parser.parse(source);

if (debugMode) {
    console.log("\x1b[33m%s\x1b[0m", "Memory:");
    console.table(parser.yy.data.semantics.getMemory());
    
    console.log("\x1b[33m%s\x1b[0m", "Dir Func:");
    console.table(parser.yy.data.semantics.getDirFunc());
    
    console.log("\x1b[33m%s\x1b[0m", "Var Table:");
    console.table(parser.yy.data.semantics.getVarTable());
    
    console.log(
      parser.yy.data.semantics.getOperandStack().isEmpty()
        ? "Operand Stack is empty"
        : parser.yy.data.semantics.getOperandStack()
    );
    console.log(
      parser.yy.data.semantics.getOperatorStack().isEmpty()
        ? "Operator Stack is empty"
        : "Operator Stack is not empty"
    );
    console.log("\x1b[33m%s\x1b[0m", "Constants:");
    console.table(parser.yy.data.semantics.getMemory()["const"]["int"]);
        
}

if (showQuadruples) {
  console.log("\x1b[33m%s\x1b[0m", "Quadruples:");
  console.table(parser.yy.data.semantics.getQuadruples());
}


const virtualmachine = new VirtualMachine(
  parser.yy.data.semantics.getQuadruples(),
  parser.yy.data.semantics.getDirFunc(),
  parser.yy.data.semantics.getMemory()
);

virtualmachine.run();


module.exports = parser;
