import type { ICore, Modules } from "@boardmeister/antetype-core";

export interface IWorkspace {
  toRelative: (value: number, direction?: 'x'|'y') => string;
  calc: (value: string) => number;
  drawWorkspace: () => void;
  download: (settings: IDownloadSettings) => Promise<void>;
  export: (settings: IExportSettings) => Promise<Blob>;
  scale: (value: number) => number;
  getQuality: () => number;
  setQuality: (quality: any) => void;
  getSize: () => IWorkspaceSize;
  shouldDrawWorkspace: (toggle: boolean) => void;
}

export interface IWorkspaceSize {
  width: number;
  height: number;
}

export enum BlobTypes {
  WEBP = 'image/webp',
  PNG = 'image/png',
  JPG = 'image/jpeg',
}

export interface IWorkspaceSettings {
  height?: number,
  width?: number;
  relative?: {
    height?: number,
    width?: number;
  }
}

export interface IExportSettings {
  type?: BlobTypes|string;
  quality?: number;
  dpi?: number;
}

export interface IDownloadSettings extends IExportSettings {
  filename: string;
}

export default class Workspace implements IWorkspace {
  #canvas: HTMLCanvasElement;
  #modules: Modules;
  #ctx: CanvasRenderingContext2D;
  #translationSet: number = 0;
  #drawWorkspace = true;
  #quality = 1;

  constructor(
    canvas: HTMLCanvasElement|null,
    modules: Modules,
  ) {
    if (!canvas) {
      throw new Error('[Antetype Workspace] Provided canvas is empty')
    }
    this.#canvas = canvas;
    this.#updateCanvas();
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext('2d')!;
  }

  #updateCanvas(): void {
    const offWidth = this.#canvas.offsetWidth,
      offHeight = this.#canvas.offsetHeight
    ;
    this.#canvas.setAttribute('width', String(offWidth * this.#quality));
    this.#canvas.setAttribute('height', String(offHeight * this.#quality));
  }

  setQuality(quality: any): void {
    if (isNaN(quality)) {
      throw new Error('Workspace quality must be a number');
    }

    this.#quality = Number(quality);
    this.#updateCanvas();
  }

  getQuality(): number {
    return this.#quality;
  }

  scale(value: number): number {
    return value * this.#quality;
  }

  typeToExt(ext?:string): string {
    if (ext == BlobTypes.PNG.toString()) {
      return 'png';
    }

    if (ext == BlobTypes.JPG.toString()) {
      return 'jpg';
    }

    return 'webp';
  }

  async download(exportArguments: IDownloadSettings): Promise<void> {
    const link = document.createElement('a');

    link.download = exportArguments.filename + '.' + this.typeToExt(exportArguments.type);
    const url = URL.createObjectURL(await this.export(exportArguments));
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * DPI calculation is made against A4 format
   */
  #updateQualityBasedOnDpi(dpi: number): void {
    const inch = 25.4;
    const a4HeightInInched = 297/inch;
    const pixels = dpi*a4HeightInInched;
    const absoluteHeight = this.getSize().height / this.#quality;

    this.setQuality(pixels / absoluteHeight);
  }

  async export({ type = BlobTypes.WEBP, quality = .9, dpi = 300 }: IExportSettings): Promise<Blob> {
    const view = this.#modules.core.view;
    const shouldDrawWorkspaceInitial = this.#drawWorkspace;
    try {
      this.shouldDrawWorkspace(false);
      this.#updateQualityBasedOnDpi(dpi);
      await view.recalculate()
      view.redraw();
      const blob = await this.#canvasToBlob(type as BlobTypes, quality);
      if (!blob) {
        throw new Error('Couldn\'t export canvas workspace')
      }

      return blob;
    } finally {
      this.shouldDrawWorkspace(shouldDrawWorkspaceInitial);
      this.setQuality(1);
      await view.recalculate()
      view.redraw();
    }
  }

  #canvasToBlob(type = BlobTypes.WEBP, quality = .9): Promise<Blob|null> {
    const { width, height } = this.getSize();
    const top = this.getTop();
    const left = this.getLeft();

    const image = this.#ctx.getImageData(left, top, width, height),
      canvas1 = document.createElement('canvas')
    ;

    canvas1.width = width;
    canvas1.height = height;
    const ctx1 = canvas1.getContext('2d')!;
    ctx1.putImageData(image, 0, 0);
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, 30000);

      canvas1.toBlob(
        blob => {
          clearTimeout(timeout);
          resolve(blob);
        },
        type,
        quality,
      );
    })
  }

  clearCanvas(): void {
    const ctx = this.#ctx;
    ctx.clearRect(
      -this.getLeft(),
      -this.getTop(),
      this.#canvas.width,
      this.#canvas.height,
    );
  }

  shouldDrawWorkspace(toggle: boolean): void {
    this.#drawWorkspace = toggle;
  }

  drawWorkspace(): void {
    if (!this.#drawWorkspace) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    const { height, width } = this.getSize();
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  getLeft(): number {
    const ctx = this.#ctx;
    const { width } = this.getSize();
    return (Number(ctx.canvas.getAttribute('width')!) - width) / 2;
  }

  getTop(): number {
    const ctx = this.#ctx;
    const { height } = this.getSize();
    return (Number(ctx.canvas.getAttribute('height')!) - height) / 2;
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

  toRelative(value: number, direction: 'x'|'y' = 'x', precision = 3): string {
    const { height, width } = this.#getSizeRelative();
    let result = (value/height * 100),
      suffix = 'h%'
    ;
    if (direction === 'x') {
      result = (value/width * 100);
      suffix = 'w%';
    }

    return String(Math.round(result * 10**precision) / 10**precision) + suffix;
  }

  calc(operation: any, quiet = false): number {
    if (typeof operation == 'number') {
      return operation * this.#quality;
    }

    if (typeof operation != 'string' || operation.match(/[^-()\d/*+.pxw%hv ]/g)) {
      console.warn('Calculation contains invalid characters!', operation)
      return NaN;
    }

    const convertUnitToNumber = (unit: string, suffixLen = 2): number => Number(unit.slice(0, unit.length - suffixLen));
    const { height: aHeight, width: aWidth } = this.getSize();
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

    let result;
    try {
      result = eval(calculation);
    } catch (e) {
      result = undefined;
      if (!quiet) console.warn('Invalid calculation! Tried to calculate from', calculation)
    }

    if (result == undefined) {
      return NaN;
    }

    /*
      Requires some explanation: due to floating point issues we are limiting any calculation results
      to be a float with precision of 2. This allows us to keep a consistent state between layers even if
      results are later used to preform other calculations.

      Also, we don't care about the incorrect rounding (1.255 to 1.25) as this is small enough that user won't be
      able to tell the difference.
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

  getSize(): IWorkspaceSize {
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
      width: width * this.#quality,
      height: height * this.#quality,
    }
  }

  #getSizeRelative(): IWorkspaceSize {
    const settings = this.#getSettings(),
      { width: aWidth, height: aHeight } = this.getSize(),
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
      size.width = height * ratio * this.#quality;
    }

    if (!size.height) {
      const width = size.width;

      size.height = height * this.#quality;
      if (width > this.#ctx.canvas.offsetWidth) {
        size.height = width * (rHeight/rWidth);
      }
    }

    return {
      width: size.width ,
      height: size.height,
    };
  }
}
