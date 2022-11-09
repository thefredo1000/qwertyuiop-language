const SCOPE_MEM_SIZE = 100000;
const TYPE_MEM_SIZE = SCOPE_MEM_SIZE / 10;

import { Stack } from "@datastructures-js/stack";

interface MemoryBatch {
  [key: string]: Array<number>;
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

  memory: Mem = {};
  quadruples: Array<Quadruple> = new Array<Quadruple>();
  dirFunc: DirFunc;
  functionStack: Stack<string> = new Stack();
  paramCounter: number = 0;

  constructor(quadruples: Array<Quadruple>, dirFunc: DirFunc, memory: Mem) {
    this.quadruples = quadruples;
    this.dirFunc = dirFunc;
    this.memory = memory;

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
        // this.and(quadruple);
        break;
      case "||":
        // this.or(quadruple);
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

  setValueInMemory(key: string, value: any) {
    const dir = parseInt(key);

    const scopeBase = Math.floor(dir / SCOPE_MEM_SIZE) % SCOPE_MEM_SIZE;
    const valType = this.getAddressType(dir);

    const base =
      scopeBase * SCOPE_MEM_SIZE +
      ((Math.floor(dir / TYPE_MEM_SIZE) % 10) % 5) * TYPE_MEM_SIZE;

    const scope = Object.keys(this.memory)[scopeBase];
    this.memory[scope][valType][dir - base] = value;
  }

  add(quadruple: Quadruple) {
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

  assign(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    const result = quadruple.result;

    if (arg1 && result) {
      const val1 = this.getValueInMemory(arg1);

      if (this.getAddressType(parseInt(result)) === "int") {
        const valResult = Math.floor(Number(val1));
        this.setValueInMemory(result, valResult);
      } else if (this.getAddressType(parseInt(result)) === "float") {
        const valResult = Number(val1);
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = val1;
        this.setValueInMemory(result, valResult);
      }
    }
  }

  print(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    if (arg1) {
      const val1 = this.getValueInMemory(arg1);
      console.log(val1);
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
      const val1 = this.getValueInMemory(arg1);
      const val2 = this.getValueInMemory(arg2);

      if (val1 === val2) {
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

      if (val1 !== val2) {
        this.setValueInMemory(result, 1);
      } else {
        this.setValueInMemory(result, 0);
      }
    }
  }

  era(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
    if (arg1) {
      const func = this.dirFunc[arg1];

      if (!func) {
        throw new Error("Function not found");
      }

      func.parameterTable.forEach((param) => {
        this.dirFunc[arg1].scope;
        // Also save it in the memory
        // this.memory[arg1][param.type].push(undefined);
        // console.log(param);
        // this.memory[arg1][param];
      });

      this.functionStack.push(arg1);
    }
  }

  goSub(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;
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
        this.setValueInMemory(result, valResult);
      } else if (this.getAddressType(parseInt(result)) === "float") {
        const valResult = Number(val1);
        this.setValueInMemory(result, valResult);
      } else {
        const valResult = val1;
        this.setValueInMemory(result, valResult);
      }
    }
    this.instructionPointer = this.instructionPointerStack.pop();
  }

  param(quadruple: Quadruple) {
    const arg1 = quadruple.arg1;

    if (
      this.paramCounter >=
      this.dirFunc[this.functionStack.peek()].parameterTable.length
    ) {
      throw new Error("Too many parameters");
    }

    if (arg1) {
      const val1 = this.getValueInMemory(arg1);
      const dir =
        this.dirFunc[this.functionStack.peek()].parameterTable[
          this.paramCounter
        ];

      if (
        this.getAddressType(parseInt(dir)) !==
        this.getAddressType(parseInt(arg1))
      ) {
        console.log(
          dir,
          arg1,
          this.getAddressType(parseInt(dir)),
          this.getAddressType(parseInt(arg1))
        );
        throw new Error("Type mismatch");
      }

      this.setValueInMemory(dir.toString(), val1);
      this.paramCounter++;
    }
  }
}

export = VirtualMachine;
