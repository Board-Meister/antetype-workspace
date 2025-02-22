// ../antetype-cursor/dist/index.js
var Event = /* @__PURE__ */ ((Event22) => {
  Event22["INIT"] = "antetype.init";
  Event22["CLOSE"] = "antetype.close";
  Event22["DRAW"] = "antetype.draw";
  Event22["CALC"] = "antetype.calc";
  Event22["RECALC_FINISHED"] = "antetype.recalc.finished";
  Event22["MODULES"] = "antetype.modules";
  return Event22;
})(Event || {});
var Event2 = /* @__PURE__ */ ((Event32) => {
  Event32["CALC"] = "antetype.cursor.calc";
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
    [Event.DRAW]: "draw"
  };
};

// ../antetype-core/dist/index.js
var Event3 = /* @__PURE__ */ ((Event22) => {
  Event22["INIT"] = "antetype.init";
  Event22["CLOSE"] = "antetype.close";
  Event22["DRAW"] = "antetype.draw";
  Event22["CALC"] = "antetype.calc";
  Event22["RECALC_FINISHED"] = "antetype.recalc.finished";
  Event22["MODULES"] = "antetype.modules";
  return Event22;
})(Event3 || {});

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
    event.detail.x = this.#instance.scale(event.detail.x);
    event.detail.y = this.#instance.scale(event.detail.y);
    event.detail.x -= this.#instance.getLeft();
    event.detail.y -= this.#instance.getTop();
  }
  static subscriptions = {
    ["antetype.workspace.calc" /* CALC */]: "calc",
    [Event3.MODULES]: "register",
    [Event3.DRAW]: [
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
    [Event2.POSITION]: "subtractWorkspace",
    [Event2.CALC]: "calc"
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;
export {
  AntetypeWorkspace,
  Event4 as Event,
  src_default as default
};
