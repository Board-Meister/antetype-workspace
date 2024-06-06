import type React from 'react'
// @ts-expect-error TS2307: Cannot find module
import styles from 'inline:./Example.css'
import type styled from "styled-components";

interface IProps {
  react: typeof React;
  styled: typeof styled;
}

const Example: React.FC<IProps> = ({ styled }) => {
  const Scope = styled.section`${styles as string}`;
  return <Scope>Hello World</Scope>
};

export default Example;
