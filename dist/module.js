// src/module.tsx
var BlobTypes = /* @__PURE__ */ ((BlobTypes2) => {
  BlobTypes2["WEBP"] = "image/webp";
  BlobTypes2["PNG"] = "image/png";
  BlobTypes2["JPG"] = "image/jpeg";
  return BlobTypes2;
})(BlobTypes || {});
var Workspace = class {
  #canvas;
  #modules;
  #ctx;
  #translationSet = 0;
  #drawWorkspace = true;
  #isExporting = false;
  #quality = 1;
  #scale = 1;
  #translate = {
    left: 0,
    top: 0
  };
  constructor(canvas, modules) {
    if (!canvas) {
      throw new Error("[Antetype Workspace] Provided canvas is empty");
    }
    this.#canvas = canvas;
    this.#updateCanvas();
    this.#modules = modules;
    this.#ctx = this.#canvas.getContext("2d");
    this.#observeCanvasResize();
  }
  #observeCanvasResize() {
    const resizeObserver = new ResizeObserver(() => {
      if (!this.#updateCanvas()) return;
      void this.#modules.core.view.recalculate().then(() => {
        this.#modules.core.view.redraw();
      });
    });
    resizeObserver.observe(this.#canvas);
  }
  #updateCanvas() {
    const offWidth = this.#canvas.offsetWidth * this.#quality, offHeight = this.#canvas.offsetHeight * this.#quality, currentW = Number(this.#canvas.getAttribute("width")), currentH = Number(this.#canvas.getAttribute("height"));
    if (!offHeight || !offWidth || currentW === offWidth && currentH === offHeight) {
      return false;
    }
    this.#canvas.setAttribute("height", String(offHeight));
    this.#canvas.setAttribute("width", String(offWidth));
    return true;
  }
  setTranslateLeft(left) {
    this.#translate.left = left;
  }
  setTranslateTop(top) {
    this.#translate.top = top;
  }
  getTranslate() {
    return this.#translate;
  }
  setQuality(quality) {
    if (isNaN(quality)) {
      throw new Error("Workspace quality must be a number");
    }
    this.#quality = Number(quality);
    this.#updateCanvas();
  }
  getQuality() {
    return this.#quality;
  }
  getScale() {
    return this.#scale;
  }
  setScale(scale) {
    if (isNaN(scale)) {
      throw new Error("Workspace scale must be a number");
    }
    this.#scale = scale;
  }
  scale(value) {
    return value * this.#scale * this.#quality;
  }
  typeToExt(ext) {
    if (ext == "image/png" /* PNG */.toString()) {
      return "png";
    }
    if (ext == "image/jpeg" /* JPG */.toString()) {
      return "jpg";
    }
    return "webp";
  }
  async download(exportArguments) {
    const link = document.createElement("a");
    link.download = exportArguments.filename + "." + this.typeToExt(exportArguments.type);
    const url = URL.createObjectURL(await this.export(exportArguments));
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
  /**
   * DPI calculation is made against A4 format
   */
  #updateQualityBasedOnDpi(dpi) {
    const inch = 25.4;
    const a4HeightInInched = 297 / inch;
    const pixels = dpi * a4HeightInInched;
    const absoluteHeight = this.getSize().height / this.#quality;
    this.setQuality(pixels / absoluteHeight);
  }
  async export({ type = "image/webp" /* WEBP */, quality = 0.9, dpi = 300 }) {
    const view = this.#modules.core.view;
    const shouldDrawWorkspaceInitial = this.#drawWorkspace;
    try {
      this.#drawWorkspace = false;
      this.setExporting(true);
      this.#updateQualityBasedOnDpi(dpi);
      this.#updateCanvas();
      await view.recalculate();
      view.redraw();
      const blob = await this.#canvasToBlob(type, quality);
      if (!blob) {
        throw new Error("Couldn't export canvas workspace");
      }
      return blob;
    } finally {
      this.#drawWorkspace = shouldDrawWorkspaceInitial;
      this.setExporting(false);
      this.setQuality(1);
      this.#updateCanvas();
      await view.recalculate();
      view.redraw();
    }
  }
  #canvasToBlob(type = "image/webp" /* WEBP */, quality = 0.9) {
    const { width: width2, height: height2 } = this.getSize();
    const top = this.getTop();
    const left = this.getLeft();
    const image = this.#ctx.getImageData(left, top, width2, height2), canvas1 = document.createElement("canvas");
    canvas1.width = width2;
    canvas1.height = height2;
    const ctx1 = canvas1.getContext("2d");
    ctx1.putImageData(image, 0, 0);
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, 3e4);
      canvas1.toBlob(
        (blob) => {
          clearTimeout(timeout);
          resolve(blob);
        },
        type,
        quality
      );
    });
  }
  clearCanvas() {
    const ctx = this.#ctx;
    ctx.clearRect(
      -this.getLeft(),
      -this.getTop(),
      this.#canvas.width,
      this.#canvas.height
    );
  }
  setExporting(toggle) {
    this.#isExporting = toggle;
  }
  isExporting() {
    return this.#isExporting;
  }
  drawWorkspace() {
    if (this.#isExporting) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    const { height: height2, width: width2 } = this.getSize();
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, width2, height2);
    ctx.restore();
  }
  getLeft() {
    const ctx = this.#ctx;
    const { width: width2 } = this.getSize();
    return (Number(ctx.canvas.getAttribute("width")) - width2) / 2 + this.getTranslate().left;
  }
  getTop() {
    const ctx = this.#ctx;
    const { height: height2 } = this.getSize();
    return (Number(ctx.canvas.getAttribute("height")) - height2) / 2 + this.getTranslate().top;
  }
  setOrigin() {
    this.#translationSet++;
    if (this.#translationSet > 1) {
      return;
    }
    const ctx = this.#ctx;
    ctx.save();
    ctx.translate(this.getLeft(), this.getTop());
  }
  restore() {
    this.#translationSet--;
    if (this.#translationSet != 0) {
      return;
    }
    this.#ctx.restore();
  }
  toRelative(value, direction = "x", precision = 3) {
    const { height: height2, width: width2 } = this.#getSizeRelative();
    value = Math.round((value + Number.EPSILON) * 10 ** precision) / 10 ** precision;
    let result2 = value / height2 * 100, suffix = "h%";
    if (direction === "x") {
      result2 = value / width2 * 100;
      suffix = "w%";
    }
    return String(Math.round((result2 + Number.EPSILON) * 10 ** precision) / 10 ** precision) + suffix;
  }
  calc(operation, quiet = false) {
    if (typeof operation == "number") {
      return this.scale(operation);
    }
    if (typeof operation != "string" || operation.match(/[^-()\d/*+.pxw%hv ]/g)) {
      console.warn("Calculation contains invalid characters!", operation);
      return NaN;
    }
    const convertUnitToNumber = (unit, suffixLen = 2) => Number(unit.slice(0, unit.length - suffixLen));
    const { height: aHeight, width: aWidth } = this.getSize();
    const { height, width } = this.#getSizeRelative();
    const unitsTranslator = {
      "px": (number) => {
        return convertUnitToNumber(number);
      },
      "w%": (number) => {
        return convertUnitToNumber(number) / 100 * width;
      },
      "h%": (number) => {
        return convertUnitToNumber(number) / 100 * height;
      },
      "vh": (number) => {
        return convertUnitToNumber(number) / 100 * aHeight;
      },
      "vw": (number) => {
        return convertUnitToNumber(number) / 100 * aWidth;
      },
      "default": (number) => number
    };
    let calculation = "";
    operation.split(" ").forEach((expression) => {
      expression = expression.trim();
      const last = expression[expression.length - 1], secondToLast = expression[expression.length - 2];
      let result2 = (unitsTranslator[secondToLast + last] || unitsTranslator.default)(expression);
      if (typeof result2 == "number") {
        result2 = this.#decimal(result2);
      }
      calculation += String(result2);
    });
    let result;
    try {
      result = eval(calculation);
    } catch (e) {
      result = void 0;
      if (!quiet) console.warn("Invalid calculation! Tried to calculate from", calculation);
    }
    if (result == void 0) {
      return NaN;
    }
    return this.#decimal(result);
  }
  #decimal(number, precision = 2) {
    return +number.toFixed(precision);
  }
  #getSystem() {
    return this.#modules.core;
  }
  #getSettings() {
    const height2 = this.#ctx.canvas.offsetHeight;
    const set = this.#getSystem().setting.get("workspace") ?? {};
    if (isNaN(Number(set.height))) {
      set.height = height2;
    }
    if (isNaN(Number(set.width))) {
      const a4Ratio = 0.707070707;
      set.width = Math.round(height2 * a4Ratio);
    }
    return set;
  }
  getSize() {
    const { width: aWidth2, height: aHeight2 } = this.#getSettings(), ratio = aWidth2 / aHeight2;
    let height2 = this.#ctx.canvas.offsetHeight, width2 = height2 * ratio;
    if (width2 > this.#ctx.canvas.offsetWidth) {
      width2 = this.#ctx.canvas.offsetWidth;
      height2 = width2 / ratio;
    }
    return {
      width: this.scale(width2),
      height: this.scale(height2)
    };
  }
  #getSizeRelative() {
    const settings = this.#getSettings(), { width: aWidth2, height: aHeight2 } = this.getSize(), rWidth = settings.relative?.width ?? aWidth2, rHeight = settings.relative?.height ?? aHeight2, ratio = rWidth / rHeight;
    const size = {
      width: settings.relative?.width ?? 0,
      height: settings.relative?.height ?? 0
    };
    const height2 = this.#ctx.canvas.offsetHeight;
    if (!size.width) {
      size.width = this.scale(height2 * ratio);
    }
    if (!size.height) {
      size.height = this.scale(height2);
    }
    if (size.width > this.#ctx.canvas.offsetWidth) {
      size.width = this.#ctx.canvas.offsetWidth;
      size.height = size.width / ratio;
    }
    return {
      width: size.width,
      height: size.height
    };
  }
  handleConditionsMethodRegisterMethod(e) {
    const { methods } = e.detail;
    methods.hideOnExport = {
      name: "Hide on export",
      type: "hide-export",
      resolve: ({ event }) => {
        if (this.isExporting()) {
          event.detail.element = null;
        }
      }
    };
  }
  getSettingsDefinition() {
    const settings = this.#getSettings();
    return {
      details: {
        label: "Workspace"
      },
      name: "workspace",
      tabs: [
        {
          label: "General",
          fields: [
            [{
              label: "Dimensions",
              type: "container",
              fields: [
                [{
                  label: "Height",
                  type: "number",
                  name: "height",
                  value: settings.height
                }, {
                  label: "Width",
                  type: "number",
                  name: "width",
                  value: settings.width
                }]
              ]
            }]
          ]
        }
      ]
    };
  }
};
export {
  BlobTypes,
  Workspace as default
};
