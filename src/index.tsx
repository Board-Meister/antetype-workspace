import type { IInjectable, IExecutable, Module } from "@boardmeister/marshal"
import type { IMinstrel } from "@boardmeister/minstrel"
import type { IHerald } from "@boardmeister/herald"
import type React from "react"
import type styled from "styled-components";
// @ts-expect-error TS2307: Cannot find module
import styles from 'inline:./output.css'

interface IInjected extends Record<string, object> {
  minstrel: IMinstrel;
  herald: IHerald;
  react: typeof React;
  styled: typeof styled;
}

const Skeleton: IInjectable = class implements IExecutable {
  injected: IInjected;

  constructor(injections: IInjected) {
    this.injected = injections;
  }

  exec(): void {
    const { minstrel, react, styled } = this.injected,
      Scope = styled.section`${styles as string}`;
    minstrel.setRoute({
      path: '/',
      element: <Scope>{minstrel.lazy(this as Module, 'page/Example/Example.js', { react, styled })}</Scope>,
    })
    minstrel.addMenuItem({
      node: react.createElement('img', {
        src: minstrel.asset(this as Module, 'example.png'),
      }),
      link: '/',
    });
  }

  static inject(): Record<string, string> {
    return {
      minstrel: 'boardmeister/minstrel:latest',
      herald: 'boardmeister/herald:latest',
      react: 'react/react:latest',
      styled: 'react/styled:latest',
    };
  }
}

export default Skeleton;
