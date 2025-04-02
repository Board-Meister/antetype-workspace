// ../antetype-core/dist/index.js
var o = ((e) => (e.INIT = "antetype.init", e.CLOSE = "antetype.close", e.DRAW = "antetype.draw", e.CALC = "antetype.calc", e.RECALC_FINISHED = "antetype.recalc.finished", e.MODULES = "antetype.modules", e.SETTINGS = "antetype.settings.definition", e))(o || {});

// src/index.tsx
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["CALC"] = "antetype.workspace.calc";
  return Event2;
})(Event || {});
var AntetypeWorkspace = class {
  #module = null;
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
    modules.workspace = new this.#module(canvas, modules, this.#injected.herald);
  }
  static subscriptions = {
    [o.MODULES]: "register"
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;
export {
  AntetypeWorkspace,
  Event,
  src_default as default
};
