import type { ModulesEvent } from "@boardmeister/antetype-core"
import type { IInjectable } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import type Workspace from "@src/module";
import { type ModulesWithCore } from "@src/module";
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
    modules.workspace = new this.#module!(canvas, modules as ModulesWithCore, this.#injected!.herald);
  }

  static subscriptions: Subscriptions = {
    [AntetypeCoreEvent.MODULES]: 'register',
  }
}

export type * from "@src/module";
const EnAntetypeWorkspace: IInjectable<IInjected>&ISubscriber = AntetypeWorkspace;
export default EnAntetypeWorkspace;
