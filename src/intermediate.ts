import { Stack } from "@datastructures-js/stack";
import { Queue } from "@datastructures-js/queue";

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

  saveVariable(
    variable: any,
    type: string,
    expression: any,
    isConst: any
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
}

export = Semantics;
