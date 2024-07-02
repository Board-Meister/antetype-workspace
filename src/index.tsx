import type { IInjectable } from "@boardmeister/marshal"
import type { Minstrel } from "@boardmeister/minstrel"
import type { IHerald } from "@boardmeister/herald"
import type React from "react"
import type styled from "styled-components";

interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: IHerald;
  react: typeof React;
  styled: typeof styled;
}

const Skeleton: IInjectable = class {
  injected?: IInjected;

  static inject: Record<string, string> = {
    minstrel: 'boardmeister/minstrel:latest',
    herald: 'boardmeister/herald:latest',
    react: 'react/react:latest',
    styled: 'react/styled:latest',
  }
  inject(injections: IInjected): void {
    this.injected = injections;
  }
}

export default Skeleton;
