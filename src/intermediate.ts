const CLASS_MEM_SIZE = 0;
const SCOPE_MEM_SIZE = 100000;
const TYPE_MEM_SIZE = SCOPE_MEM_SIZE / 10;

import { Stack } from "@datastructures-js/stack";

interface MemoryBatch {
  [key: string]: Array<any | undefined>;
}

interface Func {
  type: string;
  nLocalVar: number;
  quadCount: number;
  quadStart: number;
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

interface SemanticCube {
  [key: string]: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

const semanticCube: SemanticCube = {
  "+": {
    int: {
      int: "int",
      float: "float",
    },
    float: {
      int: "float",
      float: "float",
    },
  },
  "-": {
    int: {
      int: "int",
      float: "float",
    },
    float: {
      int: "float",
      float: "float",
    },
  },
  "*": {
    int: {
      int: "int",
      float: "float",
    },
    float: {
      int: "float",
      float: "float",
    },
  },
  "/": {
    int: {
      int: "int",
      float: "float",
    },
    float: {
      int: "float",
      float: "float",
    },
  },
};

// TODO: Change this into binary or hex or something
function getTypeDir(type: string) {
  if (type === "int") {
    return 0;
  } else if (type === "float") {
    return 1 * TYPE_MEM_SIZE;
  } else if (type === "char") {
    return 2 * TYPE_MEM_SIZE;
  } else if (type === "string") {
    return 3 * TYPE_MEM_SIZE;
  } else if (type === "bool") {
    return 4 * TYPE_MEM_SIZE;
  }
  return 5 * TYPE_MEM_SIZE;
}

class Semantics {
  memory: Mem;
  dirFunc: DirFunc;
  varTable: Array<{ varName: string; dir: number; dim?: number }>;

  tempStack: Stack<string> = new Stack();
  scopeStack: Stack<string>;
  classStack: Stack<string> = new Stack();
  operandStack: Stack<{ val: string; type: string }> = new Stack();
  operatorStack: Stack<string> = new Stack();

  dim: Array<{
    lsup: number;
    m: number | undefined;
    next: number | undefined;
  }> = [];
  startDim: number | undefined;
  prevDim: number | undefined;
  r: number | undefined = 1;
  dimStack: Stack<number> = new Stack();

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
      quadStart: 0,
      parameterTable: [],
      scope: 0,
    };
    this.dirFunc["temp"] = {
      type: "",
      nLocalVar: 0,
      quadCount: 0,
      quadStart: 0,
      parameterTable: [],
      scope: 1,
    };

    this.dirFunc["global"] = {
      type: "",
      nLocalVar: 0,
      quadCount: 0,
      quadStart: 0,
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

  getDim() {
    return this.dim;
  }

  getDimAt(index: number) {
    return this.dim[index];
  }

  getVariableType(dir: number) {
    const type = (Math.floor(dir / TYPE_MEM_SIZE) % 10) % 5;
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

  saveParam(name: string, type: string) {
    this.dirFunc[this.scopeStack.peek()].nLocalVar--;

    this.varTable.forEach((variable) => {
      if (
        variable.varName === name &&
        Math.floor(variable.dir / SCOPE_MEM_SIZE) ===
          this.dirFunc[this.scopeStack.peek()].scope
      ) {
        this.dirFunc[this.scopeStack.peek()].parameterTable.push(
          variable.dir.toString()
        );
      }
    });
  }

  saveArraySize(s: number | string) {
    const size = typeof s === "string" ? parseInt(s.toString()) : s;
    this.r = size * (this.r || 1);
    if (this.startDim === undefined) {
      this.startDim = this.dim.length;
    }
    if (this.prevDim !== undefined) {
      this.dim[this.prevDim].next = this.prevDim + 1;
    }
    this.dim.push({ lsup: size, m: undefined, next: undefined });
    this.prevDim = this.dim.length - 1;
  }

  saveArray(
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
          (Math.floor(x.dir / SCOPE_MEM_SIZE) ===
            this.dirFunc[this.scopeStack.peek()].scope ||
            Math.floor(x.dir / SCOPE_MEM_SIZE) === this.dirFunc["global"].scope)
      )
    ) {
      throw new Error(`Variable ${variable} already declared.`);
    } else {
      // If the variable is not declared in the current scope, save it
      this.dirFunc[this.scopeStack.peek()].scope;
      const dir =
        this.dirFunc[this.scopeStack.peek()].scope * SCOPE_MEM_SIZE +
        (isConst ? 500 : 0) +
        getTypeDir(type) +
        this.memory[this.scopeStack.peek()][type].length;

      this.varTable.push({
        varName: variable,
        dir: dir,
        dim: this.startDim,
      });
      this.dirFunc[this.scopeStack.peek()].nLocalVar++;
      // Also save it in the memory
      this.memory[this.scopeStack.peek()][type].push(dir.toString());
      if (this.r !== undefined) {
        for (let i = 0; i < this.r; i++) {
          this.memory[this.scopeStack.peek()][type].push(undefined);
        }
      }
    }

    let nextDim = this.startDim;
    while (nextDim !== undefined) {
      this.dim[nextDim].m = (this.r || 1) / this.dim[nextDim].lsup;
      this.r = this.dim[nextDim].m ? this.dim[nextDim].m : 1;
      nextDim = this.dim[nextDim].next;
    }
    this.r = 1;
    this.prevDim = undefined;
    this.startDim = undefined;
  }

  openClass(name: string) {
    this.classStack.push(name);
  }
  saveObjectVariable(
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
          (Math.floor(x.dir / SCOPE_MEM_SIZE) ===
            this.dirFunc[this.scopeStack.peek()].scope ||
            Math.floor(x.dir / SCOPE_MEM_SIZE) === this.dirFunc["global"].scope)
      )
    ) {
      throw new Error(`Variable ${variable} already declared.`);
    } else {
      // If the variable is not declared in the current scope, save it

      const dir =
        this.dirFunc[this.scopeStack.peek()].scope * SCOPE_MEM_SIZE +
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
          (Math.floor(x.dir / SCOPE_MEM_SIZE) ===
            this.dirFunc[this.scopeStack.peek()].scope ||
            Math.floor(x.dir / SCOPE_MEM_SIZE) === this.dirFunc["global"].scope)
      )
    ) {
      throw new Error(`Variable ${variable} already declared.`);
    } else {
      // If the variable is not declared in the current scope, save it
      const dir =
        this.dirFunc[this.scopeStack.peek()].scope * SCOPE_MEM_SIZE +
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
        quadStart: this.quadruples.length,
        parameterTable: [],
        scope: this.scopeStack.size(),
      };
    }
  }

  setFunctionType(funcName: string, type: string) {
    this.dirFunc[funcName].type = type;
  }

  closeFunction() {
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

    // this.varTable = this.varTable.filter((x) => {
    //   return (
    //     Math.floor(x.dir / SCOPE_MEM_SIZE) !==
    //     this.dirFunc[this.scopeStack.peek()].scope
    //   );
    // });
  }

  preCallFunction(funcName: string) {
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
    this.operatorStack.push("(");
  }
  callFunction(funcName: string) {
    const func = this.dirFunc[funcName];
    if (!func) {
      throw new Error(`${funcName} does not exist.`);
    } else {
      if (func.type === "void") {
        this.quadruples.push({
          op: "GOSUB",
          arg1: func.quadStart.toString(),
          arg2: "",
          result: "",
        });
      } else {
        const tempDir =
          this.tempStack.size() +
          getTypeDir(func.type) +
          this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;
        this.quadruples.push({
          op: "GOSUB",
          arg1: func.quadStart.toString(),
          arg2: "",
          result: funcName,
        });
        this.quadruples.push({
          op: "=f",
          arg1: funcName,
          arg2: "",
          result: tempDir.toString(),
        });
        this.tempStack.push(tempDir.toString());
        this.operandStack.push({ val: tempDir.toString(), type: func.type });
      }
    }
    this.operatorStack.pop();
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
      return dir;
    }

    const dir = this.memory["const"][type].length + getTypeDir(type);
    this.operandStack.push({
      val: dir.toString(),
      type,
    });

    if (type === "string" || type === "char") {
      operand = operand.replace(/['"]+/g, "");
    }
    this.memory["const"][type].push(operand.toString());
    return dir;
  }

  storeVariableOperand(variable: string) {
    const varDir = this.varTable.find((x: any) => x.varName === variable);
    if (!varDir) {
      throw new Error(`${variable} does not exist.`);
    } else {
      console.log(this.operatorStack, varDir, "help!");
      this.operandStack.push({
        val: varDir.dir.toString(),
        type: this.getVariableType(varDir.dir),
      });
    }
  }

  getAddressType(dir: number) {
    const type = (Math.floor(dir / TYPE_MEM_SIZE) % 10) % 5;
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

  getValueInMemory(key: string): any {
    if (key[0] === "*") {
      key = key.replace("*", "");
    }
    const dir = parseInt(key);

    const scopeBase = Math.floor(dir / SCOPE_MEM_SIZE) % SCOPE_MEM_SIZE;
    const valType = this.getAddressType(dir);

    const base =
      scopeBase * SCOPE_MEM_SIZE +
      ((Math.floor(dir / TYPE_MEM_SIZE) % 10) % 5) * TYPE_MEM_SIZE;

    const scope = Object.keys(this.memory)[scopeBase];

    const val = this.memory[scope][valType][dir - base];

    return val;
  }

  verifyArray() {
    const operand = this.operandStack.peek();
    this.varTable.forEach((x: any) => {
      if (x.dir.toString() === operand.val) {
        if (x.dim === undefined) {
          throw new Error(`${x.varName} is not an array.`);
        }
        this.dimStack.push(x.dim);
        this.startDim = x.dim;
      }
    });
  }

  nextDim() {
    const currDim = this.getDimAt(this.dimStack.peek());
    if (currDim.next !== undefined) {
      this.dimStack.push(currDim.next);
    }
  }

  createArrayQuad() {
    const operand = this.operandStack.peek();
    const dim = this.getDimAt(this.dimStack.peek());
    if (parseInt(this.getValueInMemory(operand.val)) >= dim.lsup) {
      throw new Error(`Index out of bounds.`);
    }

    if (dim.next !== undefined && dim.m !== undefined) {
      const operand = this.operandStack.pop();
      const tempDir =
        this.tempStack.size() +
        getTypeDir("int") +
        this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;
      // console.table(dim);

      const mDir = this.storeConstOperand(dim.m, "int");

      this.quadruples.push({
        op: "*",
        arg1: operand.val,
        arg2: mDir.toString(),
        result: tempDir.toString(),
      });

      this.tempStack.push(tempDir.toString());
      this.operandStack.push({ val: tempDir.toString(), type: "int" });
    }
    if (this.startDim !== undefined && dim !== this.getDimAt(this.startDim)) {
      const operand1 = this.operandStack.pop();
      const operand2 = this.operandStack.pop();
      const tempDir =
        this.tempStack.size() +
        getTypeDir("int") +
        this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

      this.quadruples.push({
        op: "+",
        arg1: operand1.val,
        arg2: operand2.val,
        result: tempDir.toString(),
      });

      this.tempStack.push(tempDir.toString());
      this.operandStack.pop();
      this.operandStack.push({ val: tempDir.toString(), type: "int" });
    }
  }

  processArrayCall() {
    const temp = this.operandStack.pop();
    const aux = this.operandStack.pop();

    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "+",
      arg1: temp.val,
      arg2: parseInt(aux.val).toString(),
      result: "*" + tempDir.toString(),
    });
    this.tempStack.push("*" + tempDir.toString());
    this.operandStack.push({ val: "*" + tempDir.toString(), type: "int" });
  }

  returnFunction() {
    const func = this.dirFunc[this.scopeStack.peek()];
    if (
      this.scopeStack.peek() !== "global" &&
      this.scopeStack.peek() !== "main"
    ) {
      if (func.type === "void") {
        this.quadruples.push({
          op: "RETURN",
          arg1: "",
          arg2: "",
          result: "",
        });
      } else {
        const tempDir =
          this.tempStack.size() +
          getTypeDir(func.type) +
          this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

        if (this.operandStack.peek().type !== func.type) {
          console.log(this.operandStack.peek());
          console.table(this.memory);
          throw new Error(
            `Return type (${
              this.operandStack.peek().type
            }) does not match function type (${func.type}).`
          );
        }

        this.quadruples.push({
          op: "RETURN",
          arg1: this.operandStack.pop().val,
          arg2: "",
          result: tempDir.toString(),
        });
      }
    }
  }

  storeOperator(operator: string) {
    console.log("why???", operator);
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
    const type1 = this.getAddressType(operand1);
    const type2 = this.getAddressType(operand2);

    if (
      type1 === "string" ||
      type2 === "string" ||
      type1 === "char" ||
      type2 === "char"
    ) {
      return "string";
    }
    console.log(this.isComparisonOperator(operator));
    if (this.isComparisonOperator(operator)) {
      return "bool";
    }
    if (operator === "&&" || operator === "||") {
      return "bool";
    }

    return semanticCube[operator][type1][type2];
  }

  processExpression(operators: string[]) {
    if (!operators.includes(this.operatorStack.peek())) {
      return;
    }
    if (this.operandStack.size() <= 1) return;
    const operatorStr = this.operatorStack.pop();
    if (operatorStr === "(") return;
    const { val: operand2, type: type2 } = this.operandStack.pop();
    const { val: operand1, type: type1 } = this.operandStack.pop();

    // TODO: check types
    console.log(operatorStr, operand1, operand2, "hijasklñd");
    const resultType = this.getOperatorType(operatorStr, operand1, operand2);
    console.log(resultType, "result type");
    const tempDir =
      this.tempStack.size() +
      getTypeDir(resultType) +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: operatorStr,
      arg1: operand1,
      arg2: operand2,
      result: tempDir.toString(),
    });

    console.log(resultType);
    this.operandStack.push({
      val: tempDir.toString(),
      type: resultType,
    });

    this.tempStack.push(tempDir.toString());
  }

  processSum() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "SUM",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }

  processRand() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "RAND",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processMin() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "MIN",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processMax() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "MAX",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processProd() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "PROD",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processFind() {
    const { val: operand1, type } = this.operandStack.pop();
    const { val: operand2 } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "FIND",
      arg1: operand2,
      arg2: operand1,
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processSort() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "SORT",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processMean() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "MEAN",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }

  processMode() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "MODE",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processMedian() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "MEDIAN",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processSin() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "SIN",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }

  processCos() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "COS",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processTan() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "TAN",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
  }
  processChart() {
    const { val: operand, type } = this.operandStack.pop();
    const tempDir =
      this.tempStack.size() +
      getTypeDir("int") +
      this.dirFunc["temp"].scope * SCOPE_MEM_SIZE;

    this.quadruples.push({
      op: "CHART",
      arg1: operand,
      arg2: "",
      result: tempDir.toString(),
    });
    this.tempStack.push(tempDir.toString());
    this.operandStack.push({ val: tempDir.toString(), type: "int" });
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
  processCallParams() {
    const { val: operand, type } = this.operandStack.pop();
    console.log("CAMINO POR LA CIUDAD", operand);
    this.quadruples.push({
      op: "PARAM",
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

  saveForLoop() {
    this.jumpsStack.push(this.quadruples.length);
  }
  processForLoop() {
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
  closeForLoop() {
    const jumpIndex = this.jumpsStack.pop();
    this.quadruples.push({
      op: "GOTO",
      arg1: "",
      arg2: "",
      result: this.jumpsStack.pop().toString(),
    });
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
      console.log(variable, val);
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
  storeArrayInStack() {
    const val = this.operandStack.pop();
    const arrayDir = this.operandStack.pop();

    if (val) {
      console.log(val, arrayDir);
      const dir = this.getValueInMemory(arrayDir.val);
      this.quadruples.push({
        op: "=",
        arg1: val.val,
        arg2: "",
        result: arrayDir.val,
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

  // processArraySize() {
  //   const { val: operand, type } = this.operandStack.pop();
  //   this.quadruples.push({
  //     op: "ARRAYSIZE",
  //     arg1: operand,
  //     arg2: "",
  //     result: "",
  //   });
  // }
}

export = Semantics;
