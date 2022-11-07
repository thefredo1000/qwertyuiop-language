import { Stack } from "@datastructures-js/stack";

interface MemoryBatch {
  [key: string]: Array<number>;
}

interface Func {
  type: string;
  nLocalVar: number;
  quadCount: number;
  parameterTable: Array<string>;
  scope: number;
}

interface DirFunc {
  [key: string]: Func;
}

function newMemoryBatch(): MemoryBatch {
  return {
    int: [],
    float: [],
    char: [],
    string: [],
    bool: [],
  };
}

function newDirFunc(): DirFunc {
  return {};
}

interface Mem {
  [key: string]: MemoryBatch;
}

interface Quadruple {
  op: string;
  arg1: string | undefined;
  arg2: string | undefined;
  result: string | undefined;
}

// TODO: Change this into binary or hex or something
function getTypeDir(type: string) {
  if (type === "int") {
    return 0;
  } else if (type === "float") {
    return 100;
  } else if (type === "char") {
    return 200;
  } else if (type === "string") {
    return 300;
  } else if (type === "bool") {
    return 400;
  }
  return 500;
}

class Semantics {
  memory: Mem;
  dirFunc: DirFunc;
  varTable: Array<{ varName: string; dir: number }>;
  tempStack: Stack<string> = new Stack();
  scopeStack: Stack<string>;
  operandStack: Stack<{ val: string; type: string }> = new Stack();
  operatorStack: Stack<string> = new Stack();

  quadruples: Array<Quadruple> = new Array<Quadruple>();
  jumpsStack: Stack<number> = new Stack();
  initialGoto: number = 0;

  constructor() {
    this.scopeStack = new Stack();
    this.scopeStack.push("global");

    this.memory = {};
    this.memory["const"] = newMemoryBatch();
    this.memory["temp"] = newMemoryBatch();
    this.memory["global"] = newMemoryBatch();

    this.dirFunc = newDirFunc();
    this.dirFunc["const"] = {
      type: "",
      nLocalVar: 0,
      quadCount: 0,
      parameterTable: [],
      scope: 0,
    };
    this.dirFunc["temp"] = {
      type: "",
      nLocalVar: 0,
      quadCount: 0,
      parameterTable: [],
      scope: 1,
    };

    this.dirFunc["global"] = {
      type: "",
      nLocalVar: 0,
      quadCount: 0,
      parameterTable: [],
      scope: 2,
    };

    this.scopeStack.push("global");

    this.varTable = Array<{ varName: string; dir: number }>();
  }
  openProgram() {
    this.initialGoto = this.quadruples.length - 1;
    this.quadruples.push({
      op: "GOTO",
      arg1: "",
      arg2: "",
      result: "",
    });
  }

  setInitialGoto() {
    this.quadruples[this.initialGoto + 1].result =
      this.quadruples.length.toString();
  }

  getMemory() {
    return this.memory;
  }

  getDirFunc() {
    return this.dirFunc;
  }

  getVarTable() {
    return this.varTable;
  }

  getOperandStack() {
    return this.operandStack;
  }

  getOperatorStack() {
    return this.operatorStack;
  }

  getQuadruples() {
    return this.quadruples;
  }

  getVariableType(dir: number) {
    const type = (Math.floor(dir / 100) % 10) % 5;
    if (type === 0) {
      return "int";
    } else if (type === 1) {
      return "float";
    } else if (type === 2) {
      return "char";
    } else if (type === 3) {
      return "string";
    } else if (type === 4) {
      return "bool";
    }
    return "null";
  }

  matchingType(type1: string, type2: string) {
    if (type1 === type2) {
      return true;
    } else if (type1 === "float" && type2 === "int") {
      return true;
    } else if (type1 === "int" && type2 === "float") {
      return true;
    } else if (type1 === "string" && type2 === "char") {
      return true;
    } else if (type1 === "char" && type2 === "string") {
      return true;
    }
    return false;
  }

  saveParam(type: string) {
    this.dirFunc[this.scopeStack.peek()].nLocalVar--;
    this.dirFunc[this.scopeStack.peek()].parameterTable.push(type);
  }

  saveVariable(
    variable: any,
    type: string,
    expression: any,
    isConst: boolean
  ): void {
    // If the variable is already declared in the current scope return error
    if (
      this.varTable.find(
        (x: any) =>
          x.varName === variable &&
          (Math.floor(x.dir / 1000) ===
            this.dirFunc[this.scopeStack.peek()].scope ||
            Math.floor(x.dir / 1000) === this.dirFunc["global"].scope)
      )
    ) {
      throw new Error(`Variable ${variable} already declared.`);
    } else {
      // If the variable is not declared in the current scope, save it
      this.dirFunc[this.scopeStack.peek()].scope;
      const dir =
        this.dirFunc[this.scopeStack.peek()].scope * 1000 +
        (isConst ? 500 : 0) +
        getTypeDir(type) +
        this.memory[this.scopeStack.peek()][type].length;
      this.varTable.push({
        varName: variable,
        dir: dir,
      });
      this.dirFunc[this.scopeStack.peek()].nLocalVar++;
      // Also save it in the memory
      this.memory[this.scopeStack.peek()][type].push(expression);
    }
  }

  saveFunction(funcName: any) {
    const func = this.dirFunc[funcName];
    if (func) {
      throw new Error(`${funcName} already exists.`);
    } else {
      this.scopeStack.push(funcName);
      this.memory[funcName] = newMemoryBatch();
      this.dirFunc[funcName] = {
        type: "",
        nLocalVar: 0,
        quadCount: 0,
        parameterTable: [],
        scope: this.scopeStack.size(),
      };
    }
  }

  setFunctionType(funcName: string, type: string) {
    this.dirFunc[funcName].type = type;
  }

  closeFunction() {
    // console.log("\x1b[33m%s\x1b[0m", this.scopeStack.peek());
    // console.table(this.getVarTable());
    if (
      this.scopeStack.peek() !== "global" &&
      this.scopeStack.peek() !== "main"
    ) {
      this.quadruples.push({
        op: "ENDFUNC",
        arg1: "",
        arg2: "",
        result: "",
      });
    }

    // this.dirFunc.filter((element) => {
    //   return element.funcName === this.scopeStack.peek();
    // });
    // TODO: find out what to do over here:
    this.varTable = this.varTable.filter((x) => {
      return (
        Math.floor(x.dir / 1000) !== this.dirFunc[this.scopeStack.peek()].scope
      );
    });
    // this.scopeStack.pop();
  }

  callFunction(funcName: string) {
    const func = this.dirFunc[funcName];
    if (!func) {
      throw new Error(`${funcName} does not exist.`);
    } else {
      this.quadruples.push({
        op: "ERA",
        arg1: funcName,
        arg2: "",
        result: "",
      });
    }
    console.log("Function", func);
  }

  storeOperand(operand: string, type: string) {
    if (type === "string" || type === "char") {
      operand = operand.replace(/['"]+/g, "");
    }
    this.operandStack.push({ val: operand, type });
  }

  storeConstOperand(operand: any, type: string) {
    if (this.memory["const"][type].includes(operand)) {
      const dir = this.memory["const"][type].indexOf(operand);
      this.operandStack.push({
        val: dir.toString(),
        type,
      });
      return;
    }

    const dir = this.memory["const"][type].length + getTypeDir(type);
    this.operandStack.push({
      val: dir.toString(),
      type,
    });

    if (type === "string" || type === "char") {
      operand = operand.replace(/['"]+/g, "");
    }
    this.memory["const"][type].push(operand);
  }

  storeVariableOperand(variable: string) {
    const varDir = this.varTable.find((x: any) => x.varName === variable);
    if (!varDir) {
      throw new Error(`${variable} does not exist.`);
    } else {
      this.operandStack.push({
        val: varDir.dir.toString(),
        type: this.getVariableType(varDir.dir),
      });
    }
  }

  removeOperand() {
    this.operandStack.pop();
  }
  storeOperator(operator: string) {
    this.operatorStack.push(operator);
  }

  removeOperator() {
    this.operatorStack.pop();
  }

  processIntMathematicalExpression(
    operand1: any,
    operand2: any,
    operator: any
  ) {
    if (operator === "+") {
      return parseInt(operand1) + parseInt(operand2);
    } else if (operator === "-") {
      return parseInt(operand1) - parseInt(operand2);
    } else if (operator === "*") {
      return parseInt(operand1) * parseInt(operand2);
    } else if (operator === "/") {
      return parseInt(operand1) / parseInt(operand2);
    }
  }
  processFloatMathematicalExpression(
    operand1: any,
    operand2: any,
    operator: any
  ) {
    if (operator === "+") {
      return parseFloat(operand1) + parseFloat(operand2);
    } else if (operator === "-") {
      return parseFloat(operand1) - parseFloat(operand2);
    } else if (operator === "*") {
      return parseFloat(operand1) * parseFloat(operand2);
    } else if (operator === "/") {
      return parseFloat(operand1) / parseFloat(operand2);
    }
  }

  isComparisonOperator(operator: string) {
    return (
      operator === "==" ||
      operator === "!=" ||
      operator === ">" ||
      operator === "<" ||
      operator === ">=" ||
      operator === "<="
    );
  }

  processBooleanExpression(operand1: any, operand2: any, operator: any) {
    if (operator === ">") {
      return operand1 > operand2;
    } else if (operator === "<") {
      return operand1 < operand2;
    } else if (operator === ">=") {
      return operand1 >= operand2;
    } else if (operator === "<=") {
      return operand1 <= operand2;
    } else if (operator === "==") {
      return operand1 === operand2;
    } else if (operator === "!=") {
      return operand1 !== operand2;
    }
    return false;
  }

  getOperatorType(operator: string, operand1: any, operand2: any) {
    // todo: add more operators and their types
    if (
      operator === "+" ||
      operator === "-" ||
      operator === "*" ||
      operator === "/"
    ) {
      if (operand1.type === "int" && operand2.type === "int") {
        return "int";
      } else if (operand1.type === "float" && operand2.type === "float") {
        return "float";
      } else if (operand1.type === "int" && operand2.type === "float") {
        return "float";
      } else {
        return "float";
      }
    }
    if (this.isComparisonOperator(operator)) {
      return "bool";
    }
    return "string";
  }

  processExpression(operators: string[]) {
    if (!operators.includes(this.operatorStack.peek())) {
      return;
    }
    if (this.operandStack.size() <= 1) return;
    const operatorStr = this.operatorStack.pop();
    const { val: operand2, type: type2 } = this.operandStack.pop();
    const { val: operand1, type: type1 } = this.operandStack.pop();

    // TODO: check types
    const resultType = this.getOperatorType(operatorStr, operand1, operand2);
    const tempDir =
      this.tempStack.size() +
      getTypeDir(resultType) +
      this.dirFunc["temp"].scope * 1000;

    this.quadruples.push({
      op: operatorStr,
      arg1: operand1,
      arg2: operand2,
      result: tempDir.toString(),
    });

    this.operandStack.push({
      val: tempDir.toString(),
      type: resultType,
    });

    this.tempStack.push(tempDir.toString());
  }

  processPrint() {
    const { val: operand, type } = this.operandStack.pop();
    this.quadruples.push({
      op: "PRINT",
      arg1: operand,
      arg2: "",
      result: "",
    });
  }

  processDecisionStatExpression() {
    if (this.operandStack.peek().type !== "bool") {
      throw new Error(
        `Type mismatch with ${this.operandStack.peek().val} : ${
          this.operandStack.peek().type
        }`
      );
    } else {
      const { val: operand1 } = this.operandStack.pop();
      this.quadruples.push({
        op: "GOTOF",
        arg1: operand1,
        arg2: "",
        result: "",
      });
      this.jumpsStack.push(this.quadruples.length - 1);
    }
  }

  processDecisionStatElse() {
    this.quadruples.push({
      op: "GOTO",
      arg1: "",
      arg2: "",
      result: "",
    });
    const jumpIndex = this.jumpsStack.pop();
    this.jumpsStack.push(this.quadruples.length - 1);
    this.quadruples[jumpIndex].result = this.quadruples.length.toString();
  }
  endDecisionStat() {
    const jumpIndex = this.jumpsStack.pop();
    this.quadruples[jumpIndex].result = this.quadruples.length.toString();
  }
  saveWhileLoop() {
    this.jumpsStack.push(this.quadruples.length);
  }
  processWhileLoopExpression() {
    if (this.operandStack.peek().type !== "bool") {
      throw new Error(`Type mismatch with ${this.operandStack.peek().val}`);
    } else {
      const { val: operand1 } = this.operandStack.pop();
      this.quadruples.push({
        op: "GOTOF",
        arg1: operand1,
        arg2: "",
        result: "",
      });
      this.jumpsStack.push(this.quadruples.length - 1);
    }
  }
  closeWhileLoop() {
    const jumpIndex = this.jumpsStack.pop();
    this.quadruples.push({
      op: "GOTO",
      arg1: "",
      arg2: "",
      result: this.jumpsStack.pop().toString(),
    });
    this.quadruples[jumpIndex].result = this.quadruples.length.toString();
  }

  storeData(varName: string, data: any) {
    const variable = this.varTable.find((x) => x.varName === varName);
    const val = this.operandStack.pop();
    if (variable && val) {
      const type = this.getVariableType(variable.dir);

      if (!this.matchingType(type, val.type)) {
        throw new Error(
          `Type mismatch in ${varName}, expected ${type} got ${val.type}`
        );
      }
      this.quadruples.push({
        op: "=",
        arg1: val.val,
        arg2: "",
        result: variable.dir.toString(),
      });
    }
    this.tempStack.clear();
  }

  closeProgram() {
    this.quadruples.push({
      op: "END",
      arg1: "",
      arg2: "",
      result: "",
    });
  }
}

export = Semantics;
