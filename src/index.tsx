import type { DrawEvent, ModulesEvent, CalcEvent, IBaseDef } from "@boardmeister/antetype"
import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import Workspace from "@src/module";
import { Event as AntetypeEvent } from "@boardmeister/antetype"

export interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: Herald;
}

export enum Event {
  CALC = 'antetype.workspace.calc',
}

export interface ICalcEvent<T extends Record<string, any> = Record<string, any>> {
  purpose: string;
  layerType: string;
  values: T;
}

export class AntetypeWorkspace {
  #module: (typeof Workspace)|null = null;
  #instance: Workspace|null = null;
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
      const module = this.#injected!.minstrel.getResourceUrl(this as Module, 'module.js');
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.workspace = new this.#module!(canvas, modules);
  }

  draw(event: CustomEvent<DrawEvent>): void {
    if (!this.#instance) {
      return;
    }
    const { element } = event.detail;
    const typeToAction: Record<string, (element: IBaseDef) => void> = {
      clear: this.#instance.drawCanvas.bind(this.#instance)
    };

    const el = typeToAction[element.type]
    if (typeof el == 'function') {
      el(element);
    }
  }

  setOrigin(): void {
    this.#instance?.setOrigin();
  }

  restoreOrigin(): void {
    this.#instance?.restore();
  }

  calc(event: CustomEvent<ICalcEvent>): void {
    const values = event.detail.values;
    const keys = Object.keys(values);
    for (const key of keys) {
      values[key] = this.#instance!.calc(values[key]);
    }
  }

  /**
   * @TODO Should this be moved to the core?
   */
  async cloneDefinitions(event: CustomEvent<CalcEvent>): Promise<void> {
    if (event.detail.element === null) {
      return;
    }

    event.detail.element = await this.#instance!.cloneDefinitions(event.detail.element);
  }

  static subscriptions: Subscriptions = {
    [Event.CALC]: 'calc',
    [AntetypeEvent.CALC]: [
      {
        method: 'cloneDefinitions',
        priority: -255,
      },
    ],
    [AntetypeEvent.MODULES]: 'register',
    [AntetypeEvent.DRAW]: [
      {
        method: 'draw',
        priority: 255,
      },
      {
        method: 'setOrigin',
        priority: -255,
      },
      {
        method: 'restoreOrigin',
        priority: 255,
      }
    ],
  }
}

export * from "@src/module";
const EnAntetypeWorkspace: IInjectable&ISubscriber = AntetypeWorkspace;
export default EnAntetypeWorkspace;
