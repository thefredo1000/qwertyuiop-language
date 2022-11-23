#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const intermediate_1 = __importDefault(require("./intermediate"));
const virtualmachine_1 = __importDefault(require("./virtualmachine"));
const program = require("commander");
program
    .option("-dt --debugtables", "outputs the debug tables for qwertyuiop")
    .option("-q --quadruples", "outputs the quadruples tables for qwertyuiop")
    .parse(process.argv);
if (process.argv.length < 3) {
    console.log("Please provide a file to compile");
    process.exit(1);
}
const debugMode = program.rawArgs.includes("-dt") || program.rawArgs.includes("--debugtables");
const showQuadruples = program.rawArgs.includes("-q") ||
    program.rawArgs.includes("--showquadruples");
var fs = require("fs");
var jison = require("jison");
var bnf = fs.readFileSync("src/grammar.jison", "utf8");
var parser = new jison.Parser(bnf);
var source = fs.readFileSync(process.argv.slice(2)[0], "utf8");
const semantics = new intermediate_1.default();
parser.yy.data = {
    semantics,
};
parser.generate();
parser.parse(source);
if (debugMode) {
    console.log("\x1b[33m%s\x1b[0m", "Memory:");
    console.table(parser.yy.data.semantics.getMemory());
    console.log("\x1b[33m%s\x1b[0m", "Dir Func:");
    console.table(parser.yy.data.semantics.getDirFunc());
    console.log("\x1b[33m%s\x1b[0m", "Var Table:");
    console.table(parser.yy.data.semantics.getVarTable());
    const varTable = parser.yy.data.semantics.getVarTable();
    varTable.forEach((element) => {
        if (element.dim !== undefined) {
            console.log("pass");
            let elemDim = element.dim;
            console.log(parser.yy.data.semantics.getDimAt(element.dim));
            elemDim = parser.yy.data.semantics.getDimAt(element.dim).next;
            while (elemDim !== undefined) {
                console.log(parser.yy.data.semantics.getDimAt(elemDim));
                elemDim = parser.yy.data.semantics.getDimAt(elemDim).next;
            }
        }
        else {
            console.log("no pass", element.dim);
        }
    });
    console.log(parser.yy.data.semantics.getOperandStack().isEmpty()
        ? "Operand Stack is empty"
        : parser.yy.data.semantics.getOperandStack());
    console.log(parser.yy.data.semantics.getOperatorStack().isEmpty()
        ? "Operator Stack is empty"
        : "Operator Stack is not empty");
    console.log("\x1b[33m%s\x1b[0m", "Constants:");
    console.table(parser.yy.data.semantics.getMemory()["const"]["int"]);
}
if (!showQuadruples) {
    console.log("\x1b[33m%s\x1b[0m", "Quadruples:");
    console.table(parser.yy.data.semantics.getQuadruples());
}
const virtualmachine = new virtualmachine_1.default(parser.yy.data.semantics.getQuadruples(), parser.yy.data.semantics.getDirFunc(), parser.yy.data.semantics.getMemory(), parser.yy.data.semantics.getVarTable(), parser.yy.data.semantics.getDim());
virtualmachine.run();
module.exports = parser;
