// ../antetype-cursor/dist/index.js
var s = ((t) => (t.INIT = "antetype.init", t.CLOSE = "antetype.close", t.DRAW = "antetype.draw", t.CALC = "antetype.calc", t.RECALC_FINISHED = "antetype.recalc.finished", t.MODULES = "antetype.modules", t.SETTINGS = "antetype.settings.definition", t))(s || {});
var Event = /* @__PURE__ */ ((Event22) => {
  Event22["CALC"] = "antetype.cursor.calc";
  Event22["POSITION"] = "antetype.cursor.position";
  Event22["DOWN"] = "antetype.cursor.on.down";
  Event22["UP"] = "antetype.cursor.on.up";
  Event22["MOVE"] = "antetype.cursor.on.move";
  Event22["SLIP"] = "antetype.cursor.on.slip";
  return Event22;
})(Event || {});
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
    [s.MODULES]: "register",
    [s.DRAW]: "draw"
  };
};

// ../antetype-core/dist/index.js
var s2 = ((t) => (t.INIT = "antetype.init", t.CLOSE = "antetype.close", t.DRAW = "antetype.draw", t.CALC = "antetype.calc", t.RECALC_FINISHED = "antetype.recalc.finished", t.MODULES = "antetype.modules", t.SETTINGS = "antetype.settings.definition", t))(s2 || {});

// src/index.tsx
var Event2 = /* @__PURE__ */ ((Event3) => {
  Event3["CALC"] = "antetype.workspace.calc";
  return Event3;
})(Event2 || {});
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
    event.detail.x = this.#instance.scale(event.detail.x);
    event.detail.y = this.#instance.scale(event.detail.y);
    event.detail.x -= this.#instance.getLeft();
    event.detail.y -= this.#instance.getTop();
  }
  defineSettings(e) {
    e.detail.settings.push(this.#instance.getSettingsDefinition());
  }
  static subscriptions = {
    ["antetype.workspace.calc" /* CALC */]: "calc",
    [s2.MODULES]: "register",
    [s2.DRAW]: [
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
    [Event.POSITION]: "subtractWorkspace",
    [Event.CALC]: "calc",
    [s2.SETTINGS]: "defineSettings"
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;
export {
  AntetypeWorkspace,
  Event2 as Event,
  src_default as default
};
