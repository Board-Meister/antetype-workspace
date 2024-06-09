import type { IInjectable, Module } from "@boardmeister/marshal"
import type { IMinstrel, ControllerResponse } from "@boardmeister/minstrel"
import type { IHerald } from "@boardmeister/herald"
import type React from "react"
import type styled from "styled-components";
// @ts-expect-error TS2307: Cannot find module
import styles from 'inline:../output.css'

interface IInjected extends Record<string, object> {
  minstrel: IMinstrel;
  herald: IHerald;
  react: typeof React;
  styled: typeof styled;
}

const HeadController: IInjectable = class {
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

  static $index = ({ path: '/example', description: 'Example' })
  $index(): ControllerResponse {
    const { minstrel, react, styled } = this.injected!,
      Scope = styled.section`${styles as string}`
    ;
    return <Scope>{minstrel.lazy(this as Module, 'page/Example/Example.js', { react, styled })}</Scope>;
  }
}

export default HeadController;
