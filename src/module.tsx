import type { Modules, ISystemModule, IBaseDef } from "@boardmeister/antetype";

export interface IWorkspace {
  calc: (value: string) => number;
  cloneDefinitions: (data: IBaseDef) => Promise<IBaseDef>;
}

export interface IWorkspaceSettings {
  height?: number,
  width?: number;
  relative?: {
    height?: number,
    width?: number;
  }
}

declare type RecursiveWeakMap = WeakMap<Record<string, any>, Record<string, any>>;

const cloned = Symbol('cloned');

export default class Workspace implements IWorkspace {
  #maxDepth = 50;
  #canvas: HTMLCanvasElement;
  #modules: Modules;
  #ctx: CanvasRenderingContext2D;
  #translationSet: number = 0;

  constructor(
    canvas: HTMLCanvasElement|null,
    modules: Modules,
  ) {
    if (!canvas) {
      throw new Error('[Antetype Workspace] Provided canvas is empty')
    }
    this.#canvas = canvas;
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext('2d')!;
  }

  drawCanvas(): void {
    const ctx = this.#ctx;
    ctx.save();
    ctx.fillStyle = "#FFF";
    const { height, width } = this.#getSize();
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  setOrigin(): void {
    this.#translationSet++;
    if (this.#translationSet > 1) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    const { height, width } = this.#getSize();
    ctx.translate((ctx.canvas.offsetWidth - width) / 2, (ctx.canvas.offsetHeight - height) / 2);
  }

  restore(): void {
    this.#translationSet--;
    if (this.#translationSet != 0) {
      return;
    }
    this.#ctx.restore();
  }

  calc(operation: any): number {
    if (typeof operation == 'number') {
      return operation;
    }

    if (typeof operation != 'string' || operation.match(/[^-()\d/*+.pxw%hv ]/g)) {
      return NaN;
    }

    const convertUnitToNumber = (unit: string, suffixLen = 2): number => Number(unit.slice(0, unit.length - suffixLen));
    const { height: aHeight, width: aWidth } = this.#getSize();
    const { height, width } = this.#getSizeRelative();

    const unitsTranslator: Record<string, (number: string) => number|string> = {
      'px': (number: string) => {
        return convertUnitToNumber(number);
      },
      'w%': (number: string) => {
        return (convertUnitToNumber(number)/100) * width;
      },
      'h%': (number: string) => {
        return (convertUnitToNumber(number)/100) * height;
      },
      'vh': (number: string) => {
        return (convertUnitToNumber(number)/100) * aHeight;
      },
      'vw': (number: string) => {
        return (convertUnitToNumber(number)/100) * aWidth;
      },
      'default': (number: string) => number,
    };

    let calculation = '';
    operation.split(' ').forEach(expression => {
      expression = expression.trim();
      const last = expression[expression.length - 1],
        secondToLast = expression[expression.length - 2]
      ;
      let result = (unitsTranslator[secondToLast + last] || unitsTranslator.default)(expression);

      if (typeof result == 'number') {
        result = this.#decimal(result);
      }

      calculation += String(result);
    });

    const result = eval(calculation);

    if (result == undefined) {
      return NaN;
    }

    /*
      Requires some explanation: due to floating point issues we are limiting any calculation results
      to be a float with precision of 2. This allows us to keep a consistent state between layers even if
      results are later used to preform other calculations.

      Also, we don't care about the issue of wrong round (1.255 to 1.25) as this is so small that user won't be
      able to see the difference.
     */
    return this.#decimal(result);
  }

  async cloneDefinitions(data: IBaseDef): Promise<IBaseDef> {
    return await this.#iterateResolveAndCloneObject(data, new WeakMap()) as IBaseDef;
  }

  #decimal(number: number, precision = 2): number {
    return +number.toFixed(precision);
  }

  #getSystem(): ISystemModule {
    return this.#modules.system as ISystemModule;
  }

  #getSettings(): IWorkspaceSettings {
    const height = this.#ctx.canvas.offsetHeight;
    const set = (this.#getSystem().setting.get('workspace') ?? {}) as IWorkspaceSettings;
    if (typeof set.height != 'number') {
      set.height = height;
    }

    if (typeof set.width != 'number') {
      const a4Ratio = 0.707070707; // Default A4
      set.width = height * a4Ratio;
    }

    return set;
  }

  #getSize(): { width: number, height: number} {
    const { width: aWidth, height: aHeight } = this.#getSettings()!,
      ratio = aWidth!/aHeight!
    ;
    let height = this.#ctx.canvas.offsetHeight,
      width = height * ratio
    ;

    if (width > this.#ctx.canvas.offsetWidth) {
      width = this.#ctx.canvas.offsetWidth;
      height = width * (height/width);
    }

    return {
      width,
      height,
    }
  }

  #getSizeRelative(): { width: number, height: number} {
    const settings = this.#getSettings(),
      { width: aWidth, height: aHeight } = this.#getSize(),
      rWidth = settings.relative?.width ?? aWidth,
      rHeight = settings.relative?.height ?? aHeight
    ;

    const ratio = rWidth/rHeight;
    let height = this.#ctx.canvas.offsetHeight,
      width = height * ratio
    ;

    if (width > this.#ctx.canvas.offsetWidth) {
      width = this.#ctx.canvas.offsetWidth;
      height = width * (rHeight/rWidth);
    }

    return {
      width,
      height,
    }
  }

  #isObject(value: any): boolean {
    return typeof value === 'object' && !Array.isArray(value) && value !== null;
  }

  async #iterateResolveAndCloneObject(
    object: Record<string|symbol, any>,
    recursive: RecursiveWeakMap,
    depth = 0,
  ): Promise<Record<string, any>> {
    if (recursive.has(object)) {
      return recursive.get(object)!;
    }

    if (object[cloned]) {
      return object;
    }

    const clone = {} as Record<string|symbol, any>;
    recursive.set(object, clone);
    clone[cloned] = true;
    if (this.#maxDepth <= depth + 1) {
      console.error('We\'ve reach limit depth!', object);
      throw new Error('limit reached');
    }

    await Promise.all(Object.keys(object).map(async key => {
      let result = await this.#resolve(object, key);

      if (this.#isObject(result)) {
        result = await this.#iterateResolveAndCloneObject(result, recursive, depth + 1);
      } else if (Array.isArray(result)) {
        result = await this.#iterateResolveAndCloneArray(result, recursive, depth + 1);
      }

      clone[key] = result;
    }));

    return clone;
  }

  async #iterateResolveAndCloneArray(
    object: any[],
    recursive: RecursiveWeakMap,
    depth = 0,
  ): Promise<any[]> {
    const clone = [] as any[];
    if (this.#maxDepth <= depth + 1) {
      console.error('We\'ve reach limit depth!', object);
      throw new Error('limit reached');
    }

    await Promise.all(Object.keys(object).map(async key => {
      let result = await this.#resolve(object, key);

      if (this.#isObject(result)) {
        result = await this.#iterateResolveAndCloneObject(result, recursive, depth + 1);
      } else if (Array.isArray(result)) {
        result = await this.#iterateResolveAndCloneArray(result, recursive, depth + 1);
      }

      clone.push(result);
    }));

    return clone;
  }

  async #resolve(object: Record<string, any>, key: string): Promise<any> {
    const value = object[key];
    return typeof value == 'function'
      ? await value(this.#modules, this.#ctx, object)
      : value
    ;
  }
}
