import type { IInjectable, Module } from "@boardmeister/marshal"
import type { Minstrel, ControllerResponse, ControllerDefinition } from "@boardmeister/minstrel"
import type { IHerald, ISubscriber, Subscriptions } from "@boardmeister/herald"
import type React from "react"
import type styled from "styled-components";
// @ts-expect-error TS2307: Cannot find module
import styles from 'inline:../output.css'

interface IInjected extends Record<string, object> {
  minstrel: Minstrel;
  herald: IHerald;
  react: typeof React;
  styled: typeof styled;
}

const TailController: IInjectable&ISubscriber = class {
  injected?: IInjected;

  static $index: ControllerDefinition = ({ path: '/example', description: 'Example' })
  $index = (): ControllerResponse => this.response('page/Example/Example.js')

  static inject: Record<string, string> = {
    minstrel: 'boardmeister/minstrel:latest',
    herald: 'boardmeister/herald:latest',
    react: 'react/react:latest',
    styled: 'react/styled:latest',
  }
  inject(injections: IInjected): void {
    this.injected = injections;
  }

  menu(): void {
    this.injected!.minstrel.addMenuItem({
      label: 'Example',
      link: '/',
    });
  }

  asset(path: string): string {
    return this.injected!.minstrel.asset(this as Module, path);
  }

  response(component: string): ControllerResponse {
    const { minstrel, styled } = this.injected!,
      Scope = styled.section`${styles as string}`
    ;
    return <Scope>{minstrel.lazy(this as Module, component, this.injected!)}</Scope>;
  }

  static subscriptions: Subscriptions = {
    'core.menu.setup': 'menu',
  }
}

export default TailController;
