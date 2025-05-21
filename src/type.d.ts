export enum Event {
  CALC = 'antetype.workspace.calc',
}

export interface ICalcEvent<T extends Record<string, any> = Record<string, any>> {
  purpose: string;
  layerType: string;
  values: T;
}

export interface IWorkspace {
  toRelative: (value: number, direction?: 'x'|'y') => string;
  calc: (value: string) => number;
  drawWorkspace: () => void;
  download: (settings: IDownloadSettings) => Promise<void>;
  export: (settings?: IExportSettings) => Promise<Blob>;
  scale: (value: number) => number;
  getQuality: () => number;
  setQuality: (quality: any) => void;
  getScale: () => number;
  setScale: (scale: any) => void;
  getSize: () => IWorkspaceSize;
  setExporting: (toggle: boolean) => void;
  isExporting: () => boolean;
  setTranslateLeft: (left: number) => void;
  setTranslateTop: (top: number) => void;
  getTranslate: () => ITranslate;
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

export interface ITranslate {
  left: number;
  top: number;
}