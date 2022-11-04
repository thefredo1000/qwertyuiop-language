import { Stack } from "@datastructures-js/stack";

interface MemoryBatch {
  [key: string]: Array<number>;
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
  return 0;
}

class Semantics {
  memory: Mem;
  dirFunc: Array<{ funcName: string; type: string }>;
  varTable: Array<{ varName: string; dir: number }>;
  scopeStack: Stack<string>;
  operandStack: Stack<{ val: string; type: string }> = new Stack();
  operatorStack: Stack<string> = new Stack();

  quadruples: Array<Quadruple> = new Array<Quadruple>();

  constructor() {
    this.scopeStack = new Stack();
    this.scopeStack.push("global");

    this.dirFunc = new Array<{ funcName: string; type: string }>();

    this.memory = {};
    this.memory["global"] = newMemoryBatch();
    this.varTable = Array<{ varName: string; dir: number }>();
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
    console.log(dir);
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
          (Math.floor(x.dir / 1000) === this.scopeStack.size() - 1 ||
            Math.floor(x.dir / 1000) === 0)
      )
    ) {
      throw new Error(`Variable ${variable} already declared.`);
    } else {
      // If the variable is not declared in the current scope, save it
      const dir =
        (this.scopeStack.size() - 1) * 1000 +
        (isConst ? 500 : 0) +
        getTypeDir(type) +
        this.memory[this.scopeStack.peek()][type].length;
      this.varTable.push({
        varName: variable,
        dir: dir,
      });
      // Also save it in the memory
      this.memory[this.scopeStack.peek()][type].push(expression);
    }
  }

  saveFunction(funcName: any, type: any) {
    if (
      this.dirFunc.find((element) => {
        return element.funcName === funcName;
      })
    ) {
      throw new Error(`${funcName} already exists.`);
    } else {
      this.scopeStack.push(funcName);
      this.memory[funcName] = newMemoryBatch();
      this.dirFunc.push({ funcName, type });
    }
  }
  closeFunction() {
    console.log("\x1b[33m%s\x1b[0m", this.scopeStack.peek());
    console.table(this.getVarTable());
    this.dirFunc.filter((element) => {
      return element.funcName === this.scopeStack.peek();
    });
    this.varTable = this.varTable.filter((x) => {
      return Math.floor(x.dir / 1000) !== this.scopeStack.size() - 1;
    });
    this.scopeStack.pop();
  }

  storeOperand(operand: string, type: string) {
    if (type === "string" || type === "char") {
        console.log(operand)
        operand = operand.replace(/['"]+/g, '')
    }
    this.operandStack.push({ val: operand, type });
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

  processExpression(operators: string[]) {
    if (
      !(
        this.operatorStack.peek() === operators[0] ||
        this.operatorStack.peek() === operators[1]
      )
    ) {
      return;
    }

    if (this.operandStack.size() <= 1) return;

    const operatorStr = this.operatorStack.pop();
    const { val: operand2, type: type2 } = this.operandStack.pop();
    const { val: operand1, type: type1 } = this.operandStack.pop();

    // TODO: Add type checking
    if (!this.matchingType(type1, type2)) {
      throw new Error("Type mismatch");
    }
    if (type1 === "int" && type2 === "int") {
      const result = this.processIntMathematicalExpression(
        operand1,
        operand2,
        operatorStr
      );
      if (result) {
        this.quadruples.push({
          op: operatorStr,
          arg1: operand1,
          arg2: operand2,
          result: result.toString(),
        });
        this.storeOperand(result.toString(), type1);
      }
    } else if (type1 === "float" || type2 === "float") {
        const result = this.processFloatMathematicalExpression(
          operand1,
          operand2,
          operatorStr
        );
        if (result) {
          this.quadruples.push({
            op: operatorStr,
            arg1: operand1,
            arg2: operand2,
            result: result.toString(),
          });
          this.storeOperand(result.toString(), type1);
        }
    } else if (type1 === "string" || type2 === "string" || type1 === "char" || type2 === "char") {
      if (operatorStr === "+") {
        const result = operand1.replace(/['"]+/g, '') + operand2.replace(/['"]+/g, '');
        this.quadruples.push({
          op: operatorStr,
          arg1: operand1,
          arg2: operand2,
          result: result.toString(),
        });
        this.storeOperand(result.toString(), type1);
      }
    }
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
        arg2: undefined,
        result: variable.dir.toString(),
      });
    }
  }
}

export = Semantics;
