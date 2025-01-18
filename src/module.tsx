import type { ICore } from "@boardmeister/antetype-core";
import type { Modules } from "@boardmeister/antetype";

export interface IWorkspace {
  toRelative: (value: number, direction?: 'x'|'y') => string;
  calc: (value: string) => number;
}

export interface IWorkspaceSettings {
  height?: number,
  width?: number;
  relative?: {
    height?: number,
    width?: number;
  }
}

export default class Workspace implements IWorkspace {
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
    const { height, width } = this.#getSize();
    ctx.clearRect(
      -this.getLeft(),
      -this.getTop(),
      this.#canvas.width,
      this.#canvas.height,
    );
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  getLeft(): number {
    const ctx = this.#ctx;
    const { width } = this.#getSize();
    return (ctx.canvas.offsetWidth - width) / 2;
  }

  getTop(): number {
    const ctx = this.#ctx;
    const { height } = this.#getSize();
    return (ctx.canvas.offsetHeight - height) / 2;
  }

  setOrigin(): void {
    this.#translationSet++;
    if (this.#translationSet > 1) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    ctx.translate(this.getLeft(), this.getTop());
  }

  restore(): void {
    this.#translationSet--;
    if (this.#translationSet != 0) {
      return;
    }
    this.#ctx.restore();
  }

  toRelative(value: number, direction: 'x'|'y' = 'x'): string {
    const { height, width } = this.#getSizeRelative();
    if (direction === 'x') {
      return (value/height * 100) + 'h%';
    }

    return (value/width * 100) + 'w%';
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

  #decimal(number: number, precision = 2): number {
    return +number.toFixed(precision);
  }

  #getSystem(): ICore {
    return this.#modules.core as ICore;
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

    const size = {
      width: settings.relative?.width ?? 0,
      height: settings.relative?.height ?? 0,
    }
    const height = this.#ctx.canvas.offsetHeight;

    if (!size.width) {
      const ratio = rWidth/rHeight;
      size.width = height * ratio;
    }

    if (!size.height) {
      const width = size.width;

      if (width > this.#ctx.canvas.offsetWidth) {
        size.width = this.#ctx.canvas.offsetWidth;
        size.height = width * (rHeight/rWidth);
      } else {
        size.height = height;
      }
    }

    return size;
  }
}
