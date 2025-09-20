import type { ModulesEvent } from "@boardmeister/antetype-core"
import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import type Workspace from "@src/module";
import type { ModulesWithCore } from "@src/module";
import { Event as AntetypeCoreEvent } from "@boardmeister/antetype-core"
import type Marshal from "@boardmeister/marshal";

export const ID = 'workspace';
export const VERSION = '0.0.4';

export interface IInjected extends Record<string, object> {
  marshal: Marshal;
  herald: Herald;
}

export class AntetypeWorkspace {
  #module: (typeof Workspace)|null = null;
  #injected?: IInjected;

  static inject: Record<string, string> = {
    marshal: 'boardmeister/marshal',
    herald: 'boardmeister/herald',
  }
  inject(injections: IInjected): void {
    this.#injected = injections;
  }

  register(event: ModulesEvent): void {
    const { registration } = event.detail;

    registration[ID] = {
      load: async () => {
        if (!this.#module) {
          const module = this.#injected!.marshal.getResourceUrl(this as Module, 'module.js');
          this.#module = ((await import(module)) as { default: typeof Workspace }).default;
        }

        return (modules, canvas) => new this.#module!(canvas, modules as ModulesWithCore, this.#injected!.herald)
      },
      version: VERSION,
    };
  }

  static subscriptions: Subscriptions = {
    [AntetypeCoreEvent.MODULES]: 'register',
  }
}

export type * from "@src/module";
const EnAntetypeWorkspace: IInjectable<IInjected>&ISubscriber = AntetypeWorkspace;
export default EnAntetypeWorkspace;
