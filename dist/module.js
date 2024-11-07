// src/module.tsx
var Workspace = class {
  #canvas;
  #modules;
  #ctx;
  #translationSet = 0;
  constructor(canvas, modules) {
    if (!canvas) {
      throw new Error("[Antetype Workspace] Provided canvas is empty");
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext("2d");
  }
  drawCanvas() {
    const ctx = this.#ctx;
    ctx.save();
    ctx.fillStyle = "#FFF";
    const { height: height2, width: width2 } = this.#getSize();
    ctx.fillRect(0, 0, width2, height2);
    ctx.restore();
  }
  setOrigin() {
    this.#translationSet++;
    if (this.#translationSet > 1) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    const { height: height2, width: width2 } = this.#getSize();
    ctx.translate((ctx.canvas.offsetWidth - width2) / 2, (ctx.canvas.offsetHeight - height2) / 2);
  }
  restore() {
    this.#translationSet--;
    if (this.#translationSet != 0) {
      return;
    }
    this.#ctx.restore();
  }
  calc(operation) {
    if (typeof operation == "number") {
      return operation;
    }
    if (typeof operation != "string" || operation.match(/[^-()\d/*+.pxw%hv ]/g)) {
      return NaN;
    }
    const convertUnitToNumber = (unit, suffixLen = 2) => Number(unit.slice(0, unit.length - suffixLen));
    const { height, width } = this.#getSize();
    const unitsTranslator = {
      "px": (number) => {
        return convertUnitToNumber(number);
      },
      "w%": (number) => {
        return convertUnitToNumber(number) / 100 * width;
      },
      "h%": (number) => {
        return convertUnitToNumber(number) / 100 * height;
      },
      "vh": (number) => {
        const height2 = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        return convertUnitToNumber(number) / 100 * height2;
      },
      "vw": (number) => {
        const width2 = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return convertUnitToNumber(number) / 100 * width2;
      },
      "default": (number) => number
    };
    let calculation = "";
    operation.split(" ").forEach((expression) => {
      expression = expression.trim();
      const last = expression[expression.length - 1], secondToLast = expression[expression.length - 2], result2 = (unitsTranslator[secondToLast + last] || unitsTranslator.default)(expression);
      calculation += String(isNaN(result2) ? 0 : result2);
    });
    const result = eval(calculation);
    if (result == void 0) {
      return NaN;
    }
    return result;
  }
  #getSystem() {
    return this.#modules.system;
  }
  #getSettings() {
    const height2 = this.#ctx.canvas.offsetHeight;
    return this.#getSystem().setting.get("workspace") ?? {
      height: height2,
      width: height2 * 0.707070707
    };
  }
  #getSize() {
    const ratio = this.#getSettings().width / this.#getSettings().height;
    let height2 = this.#ctx.canvas.offsetHeight, width2 = height2 * ratio;
    if (width2 > this.#ctx.canvas.offsetWidth) {
      width2 = this.#ctx.canvas.offsetWidth;
      height2 = width2 * (this.#getSettings().height / this.#getSettings().width);
    }
    return {
      width: width2,
      height: height2
    };
  }
  #isObject(value) {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  }
  async functionToNumber(data) {
    return await this.#iterateResolveAndCloneObject(data);
  }
  async #iterateResolveAndCloneObject(object) {
    const clone = {};
    await Promise.all(Object.keys(object).map(async (key) => {
      let result2 = await this.#resolve(object, key);
      if (this.#isObject(result2)) {
        result2 = await this.#iterateResolveAndCloneObject(result2);
      } else if (Array.isArray(result2)) {
        result2 = await this.#iterateResolveAndCloneArray(result2);
      }
      clone[key] = result2;
    }));
    return clone;
  }
  async #iterateResolveAndCloneArray(object) {
    const clone = [];
    await Promise.all(Object.keys(object).map(async (key) => {
      let result2 = await this.#resolve(object, key);
      if (this.#isObject(result2)) {
        result2 = await this.#iterateResolveAndCloneObject(result2);
      } else if (Array.isArray(result2)) {
        result2 = await this.#iterateResolveAndCloneArray(result2);
      }
      clone.push(result2);
    }));
    return clone;
  }
  async #resolve(object, key) {
    const value = object[key];
    const resolved = typeof value == "function" ? await value(this.#modules, object) : value;
    const calculated = this.calc(resolved);
    return isNaN(resolved) ? resolved : calculated;
  }
};
export {
  Workspace as default
};
