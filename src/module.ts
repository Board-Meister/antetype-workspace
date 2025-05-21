import type { RegisterMethodEvent } from "@boardmeister/antetype-conditions";
import type { ICore, DrawEvent, IBaseDef, Modules, SettingsEvent, ISettingsDefinition } from "@boardmeister/antetype-core";
import type { Herald  } from "@boardmeister/herald"
import type { PositionEvent } from "@boardmeister/antetype-cursor"
import { Event as AntetypeCursorEvent } from "@boardmeister/antetype-cursor"
import { Event as AntetypeCoreEvent } from "@boardmeister/antetype-core"
import { Event, BlobTypes } from "@src/type.d";
import type {
  IWorkspace, ITranslate, ICalcEvent, IDownloadSettings, IExportSettings, IWorkspaceSettings, IWorkspaceSize
} from "@src/type.d";

export interface ModulesWithCore extends Modules {
  core: ICore;
}

export default class Workspace implements IWorkspace {
  #canvas: HTMLCanvasElement;
  #modules: ModulesWithCore;
  #herald: Herald;
  #ctx: CanvasRenderingContext2D;
  #translationSet: number = 0;
  #drawWorkspace = true;
  #isExporting = false;
  #quality = 1;
  #scale = 1;
  #translate: ITranslate = {
    left: 0,
    top: 0,
  }

  constructor(
    canvas: HTMLCanvasElement|null,
    modules: ModulesWithCore,
    herald: Herald,
  ) {
    if (!canvas) {
      throw new Error('[Antetype Workspace] Provided canvas is empty')
    }
    this.#canvas = canvas;
    this.#updateCanvas();
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext('2d')!;
    this.#observeCanvasResize();
    this.#herald = herald;
    this.subscribe();
  }

  subscribe(): void {
    const unregister = this.#herald.batch([
      {
        event: AntetypeCoreEvent.CLOSE,
        subscription: () => {
          unregister();
        }
      },
      {
        event: Event.CALC,
        subscription: this.calcEventHandle.bind(this),
      },
      {
        event: AntetypeCoreEvent.DRAW,
        subscription: [
          {
            method: (event: CustomEvent<DrawEvent>): void => {
              const { element } = event.detail;
              const typeToAction: Record<string, (element: IBaseDef) => void> = {
                clear: this.clearCanvas.bind(this),
                workspace: this.drawWorkspace.bind(this),
              };

              const el = typeToAction[element.type]
              if (typeof el == 'function') {
                el(element);
              }
            },
            priority: 1,
          },
          {
            method: (): void => {
              this.setOrigin();
            },
            priority: -255,
          },
          {
            method: (): void => {
              this.restore();
            },
            priority: 255,
          }
        ]
      },
    // @TODO those bridge listeners will probably be moved to the Antetype as a defining tools
      {
        event: AntetypeCursorEvent.POSITION,
        subscription: (event: CustomEvent<PositionEvent>): void => {
          event.detail.x -= this.getLeft();
          event.detail.y -= this.getTop();
        }
      },
      {
        event: AntetypeCursorEvent.CALC,
        subscription: this.calcEventHandle.bind(this),
      },
      {
        event: AntetypeCoreEvent.SETTINGS,
        subscription: (e: SettingsEvent): void => {
          e.detail.settings.push(this.getSettingsDefinition());
        }
      },
      {
        event: 'antetype.conditions.method.register',
        subscription: (e: RegisterMethodEvent): void => {
          this.handleConditionsMethodRegisterMethod(e);
        }
      }
    ])
  }

  calcEventHandle(event: CustomEvent<ICalcEvent>): void {
    const values = event.detail.values;
    const keys = Object.keys(values);
    for (const key of keys) {
      values[key] = this.calc(values[key]);
    }
  }

  #observeCanvasResize(): void {
    const resizeObserver = new ResizeObserver(() => {
      if (!this.#updateCanvas() || !this.#modules.core) return;
      void this.#modules.core.view.recalculate().then(() => {
        this.#modules.core.view.redraw();
      })
    });

    resizeObserver.observe(this.#canvas);
  }

  #updateCanvas(): boolean {
    const offWidth = this.#canvas.offsetWidth * this.#quality,
      offHeight = this.#canvas.offsetHeight * this.#quality,
     currentW = Number(this.#canvas.getAttribute('width')),
     currentH = Number(this.#canvas.getAttribute('height'))
    ;
    if (!offHeight || !offWidth || (currentW === offWidth && currentH === offHeight)) {
      return false;
    }

    this.#canvas.setAttribute('height', String(offHeight));
    this.#canvas.setAttribute('width', String(offWidth));

    return true;
  }

  setTranslateLeft(left: number): void {
    this.#translate.left = left;
  }

  setTranslateTop(top: number): void {
    this.#translate.top = top;
  }

  getTranslate(): ITranslate {
    return this.#translate;
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

  getScale(): number {
    return this.#scale;
  }

  setScale(scale: any): void {
    if (isNaN(scale)) {
      throw new Error('Workspace scale must be a number');
    }

    this.#scale = scale;
  }

  scale(value: number): number {
    return value * this.#scale * this.#quality;
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

  async export({ type = BlobTypes.WEBP, quality = .9, dpi = 300 }: IExportSettings = {}): Promise<Blob> {
    const view = this.#modules.core.view;
    const shouldDrawWorkspaceInitial = this.#drawWorkspace;
    try {
      this.#drawWorkspace = false;
      this.setExporting(true);
      this.#updateQualityBasedOnDpi(dpi);
      this.#updateCanvas();
      await view.recalculate()
      view.redraw();
      const blob = await this.#canvasToBlob(type as BlobTypes, quality);
      if (!blob) {
        throw new Error('Couldn\'t export canvas workspace')
      }

      return blob;
    } finally {
      this.#drawWorkspace = shouldDrawWorkspaceInitial;
      this.setExporting(false);
      this.setQuality(1);
      this.#updateCanvas();
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

  setExporting(toggle: boolean): void {
    this.#isExporting = toggle;
  }

  isExporting(): boolean {
    return this.#isExporting;
  }

  drawWorkspace(): void {
    if (this.#isExporting) {
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
    return ((Number(ctx.canvas.getAttribute('width')!) - width) / 2) + this.getTranslate().left;
  }

  getTop(): number {
    const ctx = this.#ctx;
    const { height } = this.getSize();
    return ((Number(ctx.canvas.getAttribute('height')!) - height) / 2) + this.getTranslate().top;
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
    value = Math.round((value + Number.EPSILON) * 10**precision) / 10**precision;

    let result = (value/height * 100),
      suffix = 'h%'
    ;
    if (direction === 'x') {
      result = (value/width * 100);
      suffix = 'w%';
    }

    return String(Math.round((result + Number.EPSILON) * 10**precision) / 10**precision) + suffix;
  }

  calc(operation: any, quiet = false): number {
    if (typeof operation == 'number') {
      return this.scale(operation);
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
    if (isNaN(Number(set.height))) {
      set.height = height;
    }

    if (isNaN(Number(set.width))) {
      const a4Ratio = 0.707070707; // Default A4
      set.width = Math.round(height * a4Ratio);
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
      height = width / ratio;
    }

    return {
      width: this.scale(width),
      height: this.scale(height),
    }
  }

  #getSizeRelative(): IWorkspaceSize {
    const settings = this.#getSettings(),
      { width: aWidth, height: aHeight } = this.getSize(),
      rWidth = settings.relative?.width ?? aWidth,
      rHeight = settings.relative?.height ?? aHeight,
      ratio = rWidth/rHeight
    ;

    const size = {
      width: settings.relative?.width ?? 0,
      height: settings.relative?.height ?? 0,
    }
    const height = this.#ctx.canvas.offsetHeight;

    if (!size.width) {
      size.width = this.scale(height * ratio);
    }

    if (!size.height) {
      size.height = this.scale(height);
    }

    if (size.width > this.scale(this.#ctx.canvas.offsetWidth)) {
      size.width = this.scale(this.#ctx.canvas.offsetWidth);
      size.height = this.scale(this.#ctx.canvas.offsetWidth / ratio);
    }

    return {
      width: size.width,
      height: size.height,
    };
  }

  handleConditionsMethodRegisterMethod(e: RegisterMethodEvent): void {
    const { methods } = e.detail;
    methods.hideOnExport = {
      name: 'Hide on export',
      type: 'hide-export',
      resolve: ({ event }) => {
        if (this.isExporting()) {
          event.detail.element = null;
        }
      }
    }
  }

  getSettingsDefinition(): ISettingsDefinition {
    const settings = this.#getSettings();
    return {
      details: {
        label: 'Workspace',
      },
      name: 'workspace',
      tabs: [
        {
          label: 'General',
          fields: [
            [{
              label: 'Dimensions',
              type: 'container',
              fields: [
                [{
                  label: 'Height',
                  type: 'number',
                  name: 'height',
                  value: settings.height,
                }, {
                  label: 'Width',
                  type: 'number',
                  name: 'width',
                  value: settings.width,
                }]
              ]
            }]
          ]
        }
      ]
    };
  }
}
