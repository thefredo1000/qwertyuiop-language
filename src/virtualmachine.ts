const SCOPE_MEM_SIZE = 100000;
const TYPE_MEM_SIZE = SCOPE_MEM_SIZE / 10;

import { Stack } from "@datastructures-js/stack";
var asciichart = require("asciichart");

interface MemoryBatch {
  [key: string]: Array<any>;
}

interface Quadruple {
  op: string;
  arg1: string | undefined;
  arg2: string | undefined;
  result: string | undefined;
}

interface Mem {
  [key: string]: MemoryBatch;
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

class VirtualMachine {
  instructionPointer: number;
  instructionPointerStack: Stack<number> = new Stack();

  varTable: Array<{ varName: string; dir: number; dim?: number }>;

  dim: Array<{
    lsup: number;
    m: number | undefined;
    next: number | undefined;
  }> = [];

  memory: Mem = {};
  quadruples: Array<Quadruple> = new Array<Quadruple>();
  dirFunc: DirFunc;
  funcCounter: {
    [key: string]: number;
  } = {};
  returnStack: { [key: string]: Stack<any> } = {};
  currFunc: string = "";
  functionStack: Stack<string> = new Stack();
  paramCounter: number = 0;

  constructor(
    quadruples: Array<Quadruple>,
    dirFunc: DirFunc,
    memory: Mem,
    varTable: Array<{ varName: string; dir: number; dim?: number }>,
    dim: Array<{
      lsup: number;
      m: number | undefined;
      next: number | undefined;
    }>
  ) {
    this.quadruples = quadruples;
    this.dirFunc = dirFunc;
    this.memory = memory;

    this.varTable = varTable;
    this.dim = dim;

    this.instructionPointer = 0;
  }

  run() {
    while (this.instructionPointer < this.quadruples.length) {
      this.execute(this.quadruples[this.instructionPointer]);
      this.instructionPointer++;
    }
  }

  execute(quadruple: Quadruple) {
    switch (quadruple.op) {
      case "+":
        this.add(quadruple);
        break;
      case "-":
        this.sub(quadruple);
        break;
      case "*":
        this.mul(quadruple);
        break;
      case "/":
        this.div(quadruple);
        break;
      case "=":
        this.assign(quadruple);
        break;
      case "=f":
        this.assignFunction(quadruple);
        break;
      case ">":
        this.greaterThan(quadruple);
        break;
      case "<":
        this.lessThan(quadruple);
        break;
      case ">=":
        this.greaterOrEqualThan(quadruple);
        break;
      case "<=":
        this.lessOrEqualThan(quadruple);
        break;
      case "==":
        this.equal(quadruple);
        break;
      case "!=":
        this.notEqual(quadruple);
        break;
      case "&&":
        this.and(quadruple);
        break;
      case "||":
        this.or(quadruple);
        break;
      case "!":
        // this.not(quadruple);
        break;
      case "GOTO":
        this.goTo(quadruple);
        break;
      case "GOTOF":
        this.goToF(quadruple);
        break;
      case "GOTOT":
        // this.goToT(quadruple);
        break;
      case "ERA":
        this.era(quadruple);
        break;
      case "PARAM":
        this.param(quadruple);
        break;
      case "GOSUB":
        this.goSub(quadruple);
        break;
      case "ENDFUNC":
        this.endfunc(quadruple);
        break;
      case "RETURN":
        this.return(quadruple);
        break;
      case "VER":
        // this.ver(quadruple);
        break;
      case "PRINT":
        this.print(quadruple);
        break;
      case "SUM":
        this.sum(quadruple);
        break;
      case "CHART":
        this.chart(quadruple);
        break;
      case "SIN":
        this.sin(quadruple);
        break;
      case "COS":
        this.cos(quadruple);
        break;
      case "TAN":
        this.tan(quadruple);
        break;
      case "READ":
        // this.read(quadruple);
        break;
      case "END":
        // this.end(quadruple);
        break;
      default:
        break;
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
  getScope(dir: number) {
    const type = Math.floor(dir / TYPE_MEM_SIZE) % 10;
    return this.dirFunc[Object.keys(this.dirFunc)[type]].scope;
  }

  getValueInMemory(key: string): number {
    if (key && key[0] === "*") {
      const aux = this.getValueInMemory(key.slice(1));
      return aux;
    }
    const dir = parseInt(key);

    const scopeBase = Math.floor(dir / SCOPE_MEM_SIZE) % SCOPE_MEM_SIZE;
    const valType = this.getAddressType(dir);

    const base =
      scopeBase * SCOPE_MEM_SIZE +
      ((Math.floor(dir / TYPE_MEM_SIZE) % 10) % 5) * TYPE_MEM_SIZE;

    const scope = Object.keys(this.memory)[scopeBase];
    const scopeCount = Object.keys(this.funcCounter).find(
      (key) => key === scope
    );
    if (scopeCount !== undefined) {
      // console.log(
      //   "scopeCount",
      //   scopeCount +
      //     (!(this.funcCounter[scopeCount] - 1)
      //       ? this.funcCounter[scopeCount]
      //       : this.funcCounter[scopeCount] - 1)
      // );
      const val =
        this.memory[
          scopeCount +
            (!(this.funcCounter[scopeCount] - 1)
              ? this.funcCounter[scopeCount]
              : this.funcCounter[scopeCount] - 1)
        ][valType][dir - base];
      return val;
    } else {
      const val = this.memory[scope][valType][dir - base];
      return val;
    }
  }

  setValueInMemory(key: any, value: any) {
    // if (key === "100002") {
    //   console.log("SETVAL aqui es", value);
    // }
    // if (key === "300001") {
    //   console.log("SETVAL 300001 aqui es", value);
    // }
    if (key && key[0] === "*") {
      // key = this.getValueInMemory(key.slice(1));
      key = key.replace("*", "");
      const temp = this.getValueInMemory(key);
      if (temp === undefined) {
        return;
      }
      key = temp.toString();
    }
    const dir = parseInt(key);
    const scopeBase = Math.floor(dir / SCOPE_MEM_SIZE) % SCOPE_MEM_SIZE;
    const valType = this.getAddressType(dir);
    const base =
      scopeBase * SCOPE_MEM_SIZE +
      ((Math.floor(dir / TYPE_MEM_SIZE) % 10) % 5) * TYPE_MEM_SIZE;

    const scope = Object.keys(this.memory)[scopeBase];
    const scopeCount = Object.keys(this.funcCounter).find(
      (key) => key === scope
    );
    if (scopeCount !== undefined) {
      // console.log(
      //   "XXXXXXXXXXXXXX>",
      //   key,
      //   scope,
      //   ,
      //   value
      // );
      // console.table(this.memory);
      // console.log(value);
      this.funcCounter[scopeCount]++;
      this.memory[scopeCount + this.funcCounter[scopeCount]][valType][
        dir - base
      ] = value;
      this.funcCounter[scopeCount]--;
    } else {
      // console.log("============>", key, scope, value);
      this.memory[scope][valType][dir - base] = value;
    }
  }

  add(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    let result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const temp = this.getValueInMemory(arg2);
      const temp2 = typeof temp === "string" ? parseInt(temp) : temp;
      const val2 = temp2 + (result[0] === "*" ? 1 : 0);
      if (result[0] === "*") {
        result = result.slice(1);
      }
      if (
        this.getAddressType(parseInt(arg1)) === "int" &&
        this.getAddressType(parseInt(arg2)) === "int"
      ) {
        const valResult = Math.floor(Number(val1) + Number(val2));
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = Number(val1) + Number(val2);
        this.setValueInMemory(result, valResult);
      }
    }
  }

  sub(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);

      if (
        this.getAddressType(parseInt(arg1)) === "int" &&
        this.getAddressType(parseInt(arg2)) === "int"
      ) {
        const valResult = Math.floor(Number(val1) - Number(val2));
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = Number(val1) - Number(val2);
        this.setValueInMemory(result, valResult);
      }
    }
  }

  mul(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);
      // console.log("PINTAMOS TODA LA CASA", arg1, val1, arg2, val2);
      if (
        this.getAddressType(parseInt(arg1)) === "int" &&
        this.getAddressType(parseInt(arg2)) === "int"
      ) {
        const valResult = Math.floor(Number(val1) * Number(val2));
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = Number(val1) * Number(val2);
        this.setValueInMemory(result, valResult);
      }
    }
  }

  div(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);

      if (
        this.getAddressType(parseInt(arg1)) === "int" &&
        this.getAddressType(parseInt(arg2)) === "int"
      ) {
        const valResult = Math.floor(Number(val1) / Number(val2));
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = Number(val1) / Number(val2);
        this.setValueInMemory(result, valResult);
      }
    }
  }

  and(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1: boolean = this.getValueInMemory(arg1) ? true : false;
      const val2: boolean = this.getValueInMemory(arg2) ? true : false;

      const valResult: boolean = val1 && val2;
      this.setValueInMemory(result, valResult ? 1 : 0);
    }
  }

  or(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1: boolean = this.getValueInMemory(arg1) ? true : false;
      const val2: boolean = this.getValueInMemory(arg2) ? true : false;

      const valResult: boolean = val1 || val2;
      this.setValueInMemory(result, valResult ? 1 : 0);
    }
  }

  assignFunction(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const aux = quadruple.result ? quadruple.result : "";
    const result: any =
      aux[0] === "*" ? (this.getValueInMemory(aux) + 1).toString() : aux;

    if (arg1) {
      // console.log(
      //   "ASSIGN FUN now im",
      //   this.returnStack[this.currFunc].peek(),
      //   result
      // );
      // console.log("QUESESOOOOOOO", this.returnStack[this.currFunc].peek(), result);
      this.setValueInMemory(result, this.returnStack[this.currFunc].pop());
    }
  }
  assign(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const aux = quadruple.result ? quadruple.result : "";
    const result: any =
      aux[0] === "*" ? (this.getValueInMemory(aux) + 1).toString() : aux;

    if (arg1) {
      const val1 = this.getValueInMemory(arg1);

      if (this.getAddressType(parseInt(result)) === "int") {
        const valResult = Math.floor(Number(val1));
        // if (arg1 === "100002" && result === "300001") {
        //   console.log("ASSIGN ", arg1, val1, result, valResult);
        // } else {
        //   console.log("KEPASO");
        // }
        this.funcCounter[this.currFunc]--;
        this.setValueInMemory(result, valResult);
        this.funcCounter[this.currFunc]++;
      } else if (this.getAddressType(parseInt(result)) === "float") {
        const valResult = Number(val1);
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = val1;
        this.setValueInMemory(result, valResult);
      }
    }
  }

  getDimAt(index: number) {
    return this.dim[index];
  }

  exportArray(val: { varName: string; dir: number; dim?: number }) {
    if (val.dim === undefined) {
      return;
    }
    var dim = this.getDimAt(val.dim);
    let dimensions = [];
    while (dim !== undefined) {
      dimensions.push(dim.lsup);
      if (dim.next !== undefined) {
        dim = this.getDimAt(dim.next);
      } else {
        break;
      }
    }
    let total = dimensions.reduce((a, b) => a * b, 1);
    let res = [];
    for (let i = 2; i <= total + 1; i++) {
      res.push(this.getValueInMemory((val.dir + i).toString()));
    }
    return res;
  }

  sumArray(val: { varName: string; dir: number; dim?: number }) {
    const arr = this.exportArray(val);
    if (arr === undefined) {
      return 0;
    }
    return arr.reduce((partialSum, a) => partialSum + a, 0);
  }

  printArray(val: { varName: string; dir: number; dim?: number }) {
    console.log(this.exportArray(val));
  }

  sum(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const e = this.varTable.find((v) => v.dir.toString() === arg1);
    if (arg1) {
      if (e && e.dim !== undefined) {
        let result = quadruple.result;

        this.setValueInMemory(result, this.sumArray(e));
      } else if (arg1[0] === "*") {
        throw new Error(
          `sum() function can only be used with arrays, not with ${arg1}`
        );
      }
    } else {
      console.log("null");
    }
  }

  sin(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const e = this.varTable.find((v) => v.dir.toString() === arg1);
    if (arg1) {
      if (e && e.dim !== undefined) {
        throw new Error(`sin() function can't be used with arrays`);
      } else if (arg1[0] === "*") {
        const val1 = this.getValueInMemory(arg1);
        const res = Math.sin(this.getValueInMemory((val1 + 1).toString()));
        const resDir = quadruple.result;
        this.setValueInMemory(resDir, res);
      } else {
        const res = Math.sin(this.getValueInMemory(arg1));
        const resDir = quadruple.result;
        this.setValueInMemory(resDir, res);
      }
    } else {
      console.log("null");
    }
  }

  cos(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const e = this.varTable.find((v) => v.dir.toString() === arg1);
    if (arg1) {
      if (e && e.dim !== undefined) {
        throw new Error(`cos() function can't be used with arrays`);
      } else if (arg1[0] === "*") {
        const val1 = this.getValueInMemory(arg1);
        const res = Math.cos(this.getValueInMemory((val1 + 1).toString()));
        const resDir = quadruple.result;
        this.setValueInMemory(resDir, res);
      } else {
        const res = Math.cos(this.getValueInMemory(arg1));
        const resDir = quadruple.result;
        this.setValueInMemory(resDir, res);
      }
    } else {
      console.log("null");
    }
  }

  tan(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const e = this.varTable.find((v) => v.dir.toString() === arg1);
    if (arg1) {
      if (e && e.dim !== undefined) {
        throw new Error(`tan() function can't be used with arrays`);
      } else if (arg1[0] === "*") {
        const val1 = this.getValueInMemory(arg1);
        const res = Math.tan(this.getValueInMemory((val1 + 1).toString()));
        const resDir = quadruple.result;
        this.setValueInMemory(resDir, res);
      } else {
        const res = Math.tan(this.getValueInMemory(arg1));
        const resDir = quadruple.result;
        this.setValueInMemory(resDir, res);
      }
    } else {
      console.log("null");
    }
  }

  chart(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const e = this.varTable.find((v) => v.dir.toString() === arg1);
    if (arg1) {
      if (e && e.dim !== undefined) {
        console.log(asciichart.plot(this.exportArray(e)));
      } else {
        console.log("nulls");
      }
    } else {
      console.log("null");
    }
  }

  print(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const e = this.varTable.find((v) => v.dir.toString() === arg1);
    if (arg1) {
      if (e && e.dim !== undefined) {
        this.printArray(e);
      } else if (arg1[0] === "*") {
        const val1 = this.getValueInMemory(arg1);
        console.log(this.getValueInMemory((val1 + 1).toString()));
      } else {
        console.log(this.getValueInMemory(arg1));
      }
    } else {
      console.log("null");
    }
  }

  goTo(quadruple: Quadruple) {
    const result = quadruple.result;
    if (result) {
      this.instructionPointer = parseInt(result) - 1;
    }
  }

  goToF(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const result = quadruple.result;

    if (arg1 && result) {
      if (this.getValueInMemory(arg1) === 0) {
        this.instructionPointer = parseInt(result) - 1;
      }
    }
  }

  greaterThan(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);

      if (Number(val1) > Number(val2)) {
        this.setValueInMemory(result, 1);
      } else {
        this.setValueInMemory(result, 0);
      }
    }
  }

  lessThan(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);

      if (Number(val1) < Number(val2)) {
        this.setValueInMemory(result, 1);
      } else {
        this.setValueInMemory(result, 0);
      }
    }
  }

  greaterOrEqualThan(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);

      if (Number(val1) >= Number(val2)) {
        this.setValueInMemory(result, 1);
      } else {
        this.setValueInMemory(result, 0);
      }
    }
  }

  lessOrEqualThan(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);
      if (Number(val1) <= Number(val2)) {
        this.setValueInMemory(result, 1);
      } else {
        this.setValueInMemory(result, 0);
      }
    }
  }

  equal(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val2 = this.getValueInMemory(arg2);
      const val1 = this.getValueInMemory(arg1);
      if (val1.toString() === val2.toString()) {
        this.setValueInMemory(result, 1);
      } else {
        this.setValueInMemory(result, 0);
      }
    }
  }

  notEqual(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const arg2 = quadruple.arg2;
    const result = quadruple.result;

    if (arg1 && arg2 && result) {
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);
      if (val1.toString() !== val2.toString()) {
        this.setValueInMemory(result, 1);
      } else {
        this.setValueInMemory(result, 0);
      }
    }
  }

  eraCounter = 0;
  era(quadruple: Quadruple) {
    this.eraCounter++;
    const arg1 = quadruple.arg1;
    if (arg1) {
      if (this.funcCounter[arg1] === undefined) {
        this.dirFunc[arg1].quadCount = this.dirFunc[arg1].quadCount + 1;
      }
      const func =
        this.dirFunc[
          arg1 + (this.funcCounter[arg1] ? this.funcCounter[arg1] : "")
        ];
      if (!func) {
        throw new Error(`Function ${func} not found`);
      }

      if (this.funcCounter[arg1] === undefined) {
        this.funcCounter[arg1] = 1;
      } else {
        this.funcCounter[arg1]++;
      }
      this.currFunc = arg1;
      this.memory[arg1 + this.funcCounter[arg1]] = newMemoryBatch();
      this.functionStack.push(arg1 + this.funcCounter[arg1]);
      this.dirFunc[arg1 + this.funcCounter[arg1]] = Object.assign(
        {},
        this.dirFunc[arg1]
      );
      this.dirFunc[arg1 + this.funcCounter[arg1]].parameterTable = this.dirFunc[
        arg1 + this.funcCounter[arg1]
      ].parameterTable.map((p) => {
        return ((Object.keys(this.memory).length - 1) * 100000).toString();
      });
    }
  }

  goSub(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const res = quadruple.result;
    if (arg1) {
      if (
        this.paramCounter <
        this.dirFunc[this.functionStack.peek()].parameterTable.length
      ) {
        throw new Error("Not enough parameters");
      }

      this.instructionPointerStack.push(this.instructionPointer);
      this.instructionPointer = parseInt(arg1) - 1;
    }
    this.paramCounter = 0;
  }

  endfunc(quadruple: Quadruple) {
    this.instructionPointer = this.instructionPointerStack.pop();
  }

  return(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const result = quadruple.result;

    if (arg1 && result) {
      const val1 = this.getValueInMemory(arg1);

      if (this.getAddressType(parseInt(result)) === "int") {
        const valResult = Math.floor(Number(val1));
        // console.log("valResult", valResult);
        this.setValueInMemory(result, valResult);
      } else if (this.getAddressType(parseInt(result)) === "float") {
        const valResult = Number(val1);
        // console.log("valResult", valResult);
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = val1;
        // console.log("valResult", valResult);
        this.setValueInMemory(result, valResult);
      }
      if (this.returnStack[this.currFunc] === undefined) {
        // console.log("ayuda", this.returnStack);
        this.returnStack[this.currFunc] = new Stack<any>([
          this.getValueInMemory(result),
        ]);
      } else {
        this.returnStack[this.currFunc].push(this.getValueInMemory(result));
        // console.log("ayuda", this.returnStack);
        this.funcCounter[this.currFunc]--;
      }
    }
    const aux = this.quadruples[this.instructionPointerStack.peek()];

    this.instructionPointer = this.instructionPointerStack.pop();
    // console.log("INSTRUCTION POINTER IS", this.instructionPointer);
  }

  param(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    if (arg1) {
      if (
        this.paramCounter >=
        this.dirFunc[
          this.functionStack.peek() +
            (this.funcCounter[arg1] ? this.funcCounter[arg1] : "")
        ].parameterTable.length
      ) {
        throw new Error("Too many parameters");
      }

      const val1 = isNaN(this.getValueInMemory(arg1))
        ? 0
        : this.getValueInMemory(arg1);
      const dir =
        this.dirFunc[
          this.functionStack.peek() +
            (this.funcCounter[arg1] ? this.funcCounter[arg1] : "")
        ].parameterTable[this.paramCounter];

      if (
        this.getAddressType(parseInt(dir)) !==
        this.getAddressType(parseInt(arg1))
      ) {
        throw new Error("Type mismatch");
      }
      this.setValueInMemory(dir.toString(), val1);
      this.paramCounter++;
    }
  }
}

export = VirtualMachine;
