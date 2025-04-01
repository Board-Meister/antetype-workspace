import type { ModulesEvent, Modules } from "@boardmeister/antetype-core"
import type { IInjectable } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import type Workspace from "@src/module";
import { Event as AntetypeCoreEvent } from "@boardmeister/antetype-core"

export interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: Herald;
}

export class AntetypeWorkspace {
  #module: (typeof Workspace)|null = null;
  #injected?: IInjected;

  static inject: Record<string, string> = {
    minstrel: 'boardmeister/minstrel',
    herald: 'boardmeister/herald',
  }
  inject(injections: IInjected): void {
    this.#injected = injections;
  }

  async register(event: CustomEvent<ModulesEvent>): Promise<void> {
    const { modules, canvas } = event.detail;
    if (!this.#module) {
      const module = this.#injected!.minstrel.getResourceUrl(this, 'module.js');
      this.#module = (await import(module)).default;
    }
    modules.workspace = new this.#module!(canvas, modules as Modules, this.#injected!.herald);
  }

  static subscriptions: Subscriptions = {
    // [Event.CALC]: 'calc',
    [AntetypeCoreEvent.MODULES]: 'register',
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
  }
}

export type * from "@src/module";
const EnAntetypeWorkspace: IInjectable<IInjected>&ISubscriber = AntetypeWorkspace;
export default EnAntetypeWorkspace;
