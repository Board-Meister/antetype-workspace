import type { DrawEvent, IBaseDef, ModulesEvent, Modules, SettingsEvent } from "@boardmeister/antetype-core"
import type { IInjectable } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { PositionEvent } from "@boardmeister/antetype-cursor"
import type { Herald, ISubscriber, Subscriptions  } from "@boardmeister/herald"
import type Workspace from "@src/module";
import { Event as AntetypeCursorEvent } from "@boardmeister/antetype-cursor"
import { Event as AntetypeCoreEvent } from "@boardmeister/antetype-core"

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
      const module = this.#injected!.minstrel.getResourceUrl(this, 'module.js');
      this.#module = (await import(module)).default;
    }
    this.#instance = modules.workspace = new this.#module!(canvas, modules as Modules);
  }

  draw(event: CustomEvent<DrawEvent>): void {
    if (!this.#instance) {
      return;
    }

    const { element } = event.detail;
    const typeToAction: Record<string, (element: IBaseDef) => void> = {
      clear: this.#instance.clearCanvas.bind(this.#instance),
      workspace: this.#instance.drawWorkspace.bind(this.#instance),
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

  subtractWorkspace(event: CustomEvent<PositionEvent>): void {
    event.detail.x -= this.#instance!.getLeft();
    event.detail.y -= this.#instance!.getTop();
  }

  defineSettings(e: SettingsEvent): void {
    e.detail.settings.push(this.#instance!.getSettingsDefinition());
  }

  static subscriptions: Subscriptions = {
    [Event.CALC]: 'calc',
    [AntetypeCoreEvent.MODULES]: 'register',
    [AntetypeCoreEvent.DRAW]: [
      {
        method: 'draw',
        priority: 1,
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
    // @TODO those bridge listeners will probably be move to the Antetype as a defining tools
    [AntetypeCursorEvent.POSITION]: 'subtractWorkspace',
    [AntetypeCursorEvent.CALC]: 'calc',
    [AntetypeCoreEvent.SETTINGS]: 'defineSettings',
  }
}

export type * from "@src/module";
const EnAntetypeWorkspace: IInjectable<IInjected>&ISubscriber = AntetypeWorkspace;
export default EnAntetypeWorkspace;
