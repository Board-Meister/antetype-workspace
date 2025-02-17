// ../antetype-cursor/dist/index.js
var Event = /* @__PURE__ */ ((Event22) => {
  Event22["STRUCTURE"] = "antetype.structure";
  Event22["MIDDLE"] = "antetype.structure.middle";
  Event22["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event22["CENTER"] = "antetype.structure.center";
  Event22["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event22["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event22["BAR_TOP"] = "antetype.structure.bar.top";
  Event22["MODULES"] = "antetype.modules";
  Event22["ACTIONS"] = "antetype.structure.column.left.actions";
  Event22["PROPERTIES"] = "antetype.structure.column.left.properties";
  return Event22;
})(Event || {});
var i = ((e) => (e.STRUCTURE = "antetype.structure", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e.ACTIONS = "antetype.structure.column.left.actions", e.PROPERTIES = "antetype.structure.column.left.properties", e))(i || {});
var c = ((r2) => (r2.INIT = "antetype.init", r2.CLOSE = "antetype.close", r2.DRAW = "antetype.draw", r2.CALC = "antetype.calc", r2))(c || {});
var s = class {
  #t;
  #r = null;
  #e = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(t) {
    this.#t = t;
  }
  async #n(t, n) {
    if (!this.#e) {
      let o2 = this.#t.minstrel.getResourceUrl(this, "core.js");
      this.#r = (await import(o2)).default, this.#e = this.#r({ canvas: n, modules: t, injected: this.#t });
    }
    return this.#e;
  }
  async register(t) {
    let { modules: n, canvas: o2 } = t.detail;
    n.core = await this.#n(n, o2);
  }
  async init(t) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    let { base: n, settings: o2 } = t.detail;
    for (let a in o2) this.#e.setting.set(a, o2[a]);
    let r2 = this.#e.meta.document;
    r2.base = n;
    let l = [];
    return (this.#e.setting.get("fonts") ?? []).forEach((a) => {
      l.push(this.#e.font.load(a));
    }), await Promise.all(l), r2.layout = await this.#e.view.recalculate(r2, r2.base), await this.#e.view.redraw(r2.layout), r2;
  }
  async cloneDefinitions(t) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    t.detail.element !== null && (t.detail.element = await this.#e.clone.definitions(t.detail.element));
  }
  static subscriptions = { [i.MODULES]: "register", "antetype.init": "init", "antetype.calc": [{ method: "cloneDefinitions", priority: -255 }] };
};
var r = ((e) => (e.STRUCTURE = "antetype.structure", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e.ACTIONS = "antetype.structure.column.left.actions", e.PROPERTIES = "antetype.structure.column.left.properties", e))(r || {});
var i2 = ((t) => (t.SAVE = "antetype.memento.save", t))(i2 || {});
var o = class {
  #e;
  #t = null;
  #r = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(t) {
    this.#e = t;
  }
  async register(t) {
    let { modules: s22, canvas: n } = t.detail;
    if (!this.#t) {
      let a = this.#e.minstrel.getResourceUrl(this, "module.js");
      this.#t = (await import(a)).default;
    }
    this.#r = s22.transform = this.#t({ canvas: n, modules: s22, injected: this.#e });
  }
  save(t) {
    this.#r && this.#r.addToStack(t.detail.state);
  }
  static subscriptions = { [r.MODULES]: "register", "antetype.memento.save": "save" };
};
var Event2 = /* @__PURE__ */ ((Event32) => {
  Event32["POSITION"] = "antetype.cursor.position";
  Event32["DOWN"] = "antetype.cursor.on.down";
  Event32["UP"] = "antetype.cursor.on.up";
  Event32["MOVE"] = "antetype.cursor.on.move";
  Event32["SLIP"] = "antetype.cursor.on.slip";
  return Event32;
})(Event2 || {});
var AntetypeCursor = class {
  #injected;
  #module = null;
  #instance = null;
  static inject = {
    minstrel: "boardmeister/minstrel",
    herald: "boardmeister/herald"
  };
  inject(injections) {
    this.#injected = injections;
  }
  async register(event) {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected.minstrel.getResourceUrl(this, "module.js");
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.cursor = this.#module({
      canvas,
      modules,
      injected: this.#injected
    });
  }
  // @TODO there is not unregister method to remove all subscriptions
  draw(event) {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction = {
      selection: this.#instance.drawSelection
    };
    const el = typeToAction[element.type];
    if (typeof el == "function") {
      el(element);
    }
  }
  static subscriptions = {
    [Event.MODULES]: "register",
    [c.DRAW]: "draw"
  };
};

// ../../tool/antetype/dist/index.js
var Event3 = /* @__PURE__ */ ((Event22) => {
  Event22["STRUCTURE"] = "antetype.structure";
  Event22["MIDDLE"] = "antetype.structure.middle";
  Event22["BAR_BOTTOM"] = "antetype.structure.bar.bottom";
  Event22["CENTER"] = "antetype.structure.center";
  Event22["COLUMN_LEFT"] = "antetype.structure.column.left";
  Event22["COLUMN_RIGHT"] = "antetype.structure.column.right";
  Event22["BAR_TOP"] = "antetype.structure.bar.top";
  Event22["MODULES"] = "antetype.modules";
  Event22["ACTIONS"] = "antetype.structure.column.left.actions";
  Event22["PROPERTIES"] = "antetype.structure.column.left.properties";
  Event22["SHOW_PROPERTIES"] = "antetype.structure.column.left.properties.show";
  return Event22;
})(Event3 || {});

// ../antetype-core/dist/index.js
var i3 = ((e) => (e.STRUCTURE = "antetype.structure", e.MIDDLE = "antetype.structure.middle", e.BAR_BOTTOM = "antetype.structure.bar.bottom", e.CENTER = "antetype.structure.center", e.COLUMN_LEFT = "antetype.structure.column.left", e.COLUMN_RIGHT = "antetype.structure.column.right", e.BAR_TOP = "antetype.structure.bar.top", e.MODULES = "antetype.modules", e.ACTIONS = "antetype.structure.column.left.actions", e.PROPERTIES = "antetype.structure.column.left.properties", e))(i3 || {});
var c2 = ((r2) => (r2.INIT = "antetype.init", r2.CLOSE = "antetype.close", r2.DRAW = "antetype.draw", r2.CALC = "antetype.calc", r2))(c2 || {});
var s2 = class {
  #t;
  #r = null;
  #e = null;
  static inject = { minstrel: "boardmeister/minstrel", herald: "boardmeister/herald" };
  inject(t) {
    this.#t = t;
  }
  async #n(t, n) {
    if (!this.#e) {
      let o2 = this.#t.minstrel.getResourceUrl(this, "core.js");
      this.#r = (await import(o2)).default, this.#e = this.#r({ canvas: n, modules: t, injected: this.#t });
    }
    return this.#e;
  }
  async register(t) {
    let { modules: n, canvas: o2 } = t.detail;
    n.core = await this.#n(n, o2);
  }
  async init(t) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    let { base: n, settings: o2 } = t.detail;
    for (let a in o2) this.#e.setting.set(a, o2[a]);
    let r2 = this.#e.meta.document;
    r2.base = n;
    let l = [];
    return (this.#e.setting.get("fonts") ?? []).forEach((a) => {
      l.push(this.#e.font.load(a));
    }), await Promise.all(l), r2.layout = await this.#e.view.recalculate(r2, r2.base), await this.#e.view.redraw(r2.layout), r2;
  }
  async cloneDefinitions(t) {
    if (!this.#e) throw new Error("Instance not loaded, trigger registration event first");
    t.detail.element !== null && (t.detail.element = await this.#e.clone.definitions(t.detail.element));
  }
  static subscriptions = { [i3.MODULES]: "register", "antetype.init": "init", "antetype.calc": [{ method: "cloneDefinitions", priority: -255 }] };
};

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
  clearCanvas() {
    const ctx = this.#ctx;
    ctx.clearRect(
      -this.getLeft(),
      -this.getTop(),
      this.#canvas.width,
      this.#canvas.height
    );
  }
  drawWorkspace() {
    const ctx = this.#ctx;
    ctx.save();
    const { height: height2, width: width2 } = this.#getSize();
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, width2, height2);
    ctx.restore();
  }
  getLeft() {
    const ctx = this.#ctx;
    const { width: width2 } = this.#getSize();
    return (ctx.canvas.offsetWidth - width2) / 2;
  }
  getTop() {
    const ctx = this.#ctx;
    const { height: height2 } = this.#getSize();
    return (ctx.canvas.offsetHeight - height2) / 2;
  }
  setOrigin() {
    this.#translationSet++;
    if (this.#translationSet > 1) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    ctx.translate(this.getLeft(), this.getTop());
  }
  restore() {
    this.#translationSet--;
    if (this.#translationSet != 0) {
      return;
    }
    this.#ctx.restore();
  }
  toRelative(value, direction = "x", precision = 3) {
    const { height: height2, width: width2 } = this.#getSizeRelative();
    let result2 = value / height2 * 100, suffix = "h%";
    if (direction === "x") {
      result2 = value / width2 * 100;
      suffix = "w%";
    }
    return String(Math.round(result2 * 10 ** precision) / 10 ** precision) + suffix;
  }
  calc(operation, quiet = false) {
    if (typeof operation == "number") {
      return operation;
    }
    if (typeof operation != "string" || operation.match(/[^-()\d/*+.pxw%hv ]/g)) {
      console.warn("Calculation contains invalid characters!", operation);
      return NaN;
    }
    const convertUnitToNumber = (unit, suffixLen = 2) => Number(unit.slice(0, unit.length - suffixLen));
    const { height: aHeight, width: aWidth } = this.#getSize();
    const { height, width } = this.#getSizeRelative();
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
        return convertUnitToNumber(number) / 100 * aHeight;
      },
      "vw": (number) => {
        return convertUnitToNumber(number) / 100 * aWidth;
      },
      "default": (number) => number
    };
    let calculation = "";
    operation.split(" ").forEach((expression) => {
      expression = expression.trim();
      const last = expression[expression.length - 1], secondToLast = expression[expression.length - 2];
      let result2 = (unitsTranslator[secondToLast + last] || unitsTranslator.default)(expression);
      if (typeof result2 == "number") {
        result2 = this.#decimal(result2);
      }
      calculation += String(result2);
    });
    let result;
    try {
      result = eval(calculation);
    } catch (e) {
      result = void 0;
      if (!quiet) console.warn("Invalid calculation! Tried to calculate from", calculation);
    }
    if (result == void 0) {
      return NaN;
    }
    return this.#decimal(result);
  }
  #decimal(number, precision = 2) {
    return +number.toFixed(precision);
  }
  #getSystem() {
    return this.#modules.core;
  }
  #getSettings() {
    const height2 = this.#ctx.canvas.offsetHeight;
    const set = this.#getSystem().setting.get("workspace") ?? {};
    if (typeof set.height != "number") {
      set.height = height2;
    }
    if (typeof set.width != "number") {
      const a4Ratio = 0.707070707;
      set.width = height2 * a4Ratio;
    }
    return set;
  }
  #getSize() {
    const { width: aWidth2, height: aHeight2 } = this.#getSettings(), ratio = aWidth2 / aHeight2;
    let height2 = this.#ctx.canvas.offsetHeight, width2 = height2 * ratio;
    if (width2 > this.#ctx.canvas.offsetWidth) {
      width2 = this.#ctx.canvas.offsetWidth;
      height2 = width2 * (height2 / width2);
    }
    return {
      width: width2,
      height: height2
    };
  }
  #getSizeRelative() {
    const settings = this.#getSettings(), { width: aWidth2, height: aHeight2 } = this.#getSize(), rWidth = settings.relative?.width ?? aWidth2, rHeight = settings.relative?.height ?? aHeight2;
    const size = {
      width: settings.relative?.width ?? 0,
      height: settings.relative?.height ?? 0
    };
    const height2 = this.#ctx.canvas.offsetHeight;
    if (!size.width) {
      const ratio = rWidth / rHeight;
      size.width = height2 * ratio;
    }
    if (!size.height) {
      const width2 = size.width;
      if (width2 > this.#ctx.canvas.offsetWidth) {
        size.width = this.#ctx.canvas.offsetWidth;
        size.height = width2 * (rHeight / rWidth);
      } else {
        size.height = height2;
      }
    }
    return size;
  }
};

// src/index.tsx
var Event4 = /* @__PURE__ */ ((Event5) => {
  Event5["CALC"] = "antetype.workspace.calc";
  return Event5;
})(Event4 || {});
var AntetypeWorkspace = class {
  #module = null;
  #instance = null;
  #injected;
  static inject = {
    minstrel: "boardmeister/minstrel",
    herald: "boardmeister/herald"
  };
  inject(injections) {
    this.#injected = injections;
  }
  async register(event) {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected.minstrel.getResourceUrl(this, "module.js");
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.workspace = new this.#module(canvas, modules);
  }
  draw(event) {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction = {
      clear: this.#instance.clearCanvas.bind(this.#instance),
      workspace: this.#instance.drawWorkspace.bind(this.#instance)
    };
    const el = typeToAction[element.type];
    if (typeof el == "function") {
      el(element);
    }
  }
  setOrigin() {
    this.#instance?.setOrigin();
  }
  restoreOrigin() {
    this.#instance?.restore();
  }
  calc(event) {
    const values = event.detail.values;
    const keys = Object.keys(values);
    for (const key of keys) {
      values[key] = this.#instance.calc(values[key]);
    }
  }
  subtractWorkspace(event) {
    event.detail.x -= this.#instance.getLeft();
    event.detail.y -= this.#instance.getTop();
  }
  static subscriptions = {
    ["antetype.workspace.calc" /* CALC */]: "calc",
    [Event3.MODULES]: "register",
    [c2.DRAW]: [
      {
        method: "draw",
        priority: 1
      },
      {
        method: "setOrigin",
        priority: -255
      },
      {
        method: "restoreOrigin",
        priority: 255
      }
    ],
    // @TODO those bridge listeners will probably be move to the Antetype as a defining tools
    [Event2.POSITION]: "subtractWorkspace"
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;
export {
  AntetypeWorkspace,
  Event4 as Event,
  src_default as default
};
