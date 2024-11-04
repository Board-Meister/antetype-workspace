import type { Modules, ISystemModule } from "@boardmeister/antetype";

export interface IWorkspace {
  calc: (value: string) => number;
}

export interface IWorkspaceSettings {
  height: number,
  width: number;
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

    if (typeof operation != 'string') {
      return NaN;
    }

    const convertUnitToNumber = (unit: string, suffixLen = 2): number => Number(unit.slice(0, unit.length - suffixLen));
    const { height, width } = this.#getSize();

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
        const height = window.innerHeight || document.documentElement.clientHeight|| document.body.clientHeight;
        return (convertUnitToNumber(number)/100) * height;
      },
      'vw': (number: string) => {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return (convertUnitToNumber(number)/100) * width;
      },
      'default': (number: string) => number,
    };

    let calculation = '';
    operation.split(' ').forEach(expression => {
      expression = expression.trim();
      const last = expression[expression.length - 1],
        secondToLast = expression[expression.length - 2]
      ;
      calculation += String((
        unitsTranslator[secondToLast + last] || unitsTranslator.default
      )(expression));
    });

    const result = eval(calculation.replace(/[^-()\d/*+.]/g, ''));

    if (result == undefined) {
      return NaN;
    }

    return result;
  }

  #getSystem(): ISystemModule {
    return this.#modules.system as ISystemModule;
  }

  #getSettings(): IWorkspaceSettings {
    const height = this.#ctx.canvas.offsetHeight;
    return this.#getSystem().setting.get('workspace') ?? {
      height,
      width: height * 0.707070707
    };
  }

  #getSize(): { width: number, height: number} {
    const ratio = this.#getSettings().width/this.#getSettings().height;
    let height = this.#ctx.canvas.offsetHeight,
      width = height * ratio
    ;

    if (width > this.#ctx.canvas.offsetWidth) {
      width = this.#ctx.canvas.offsetWidth;
      height = width * (this.#getSettings().height/this.#getSettings().width);
    }

    return {
      width,
      height,
    }
  }
}
