// ../antetype-core/dist/index.js
var s = ((t) => (t.INIT = "antetype.init", t.CLOSE = "antetype.close", t.DRAW = "antetype.draw", t.CALC = "antetype.calc", t.RECALC_FINISHED = "antetype.recalc.finished", t.MODULES = "antetype.modules", t.SETTINGS = "antetype.settings.definition", t))(s || {});

// src/index.tsx
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
    // [Event.CALC]: 'calc',
    [s.MODULES]: "register"
    // [AntetypeCoreEvent.DRAW]: [
    //   {
    //     method: 'draw',
    //     priority: 1,
    //   },
    //   {
    //     method: 'setOrigin',
    //     priority: -255,
    //   },
    //   {
    //     method: 'restoreOrigin',
    //     priority: 255,
    //   }
    // ],
    // @TODO those bridge listeners will probably be move to the Antetype as a defining tools
    // [AntetypeCursorEvent.POSITION]: 'subtractWorkspace',
    // [AntetypeCursorEvent.CALC]: 'calc',
    // [AntetypeCoreEvent.SETTINGS]: 'defineSettings',
    // 'antetype.conditions.method.register': 'registerConditionMethods',
  };
};
var EnAntetypeWorkspace = AntetypeWorkspace;
var src_default = EnAntetypeWorkspace;
export {
  AntetypeWorkspace,
  src_default as default
};
