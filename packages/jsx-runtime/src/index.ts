import { createElement, ReactComponent, ReactElement } from "@proto-react/core"

export declare namespace JSX {
  type ElementType =
    | {
      tag: "text"
      value: string
    }
    | {
      tag: "node"
      value: string
    }
    | {
      tag: "component"
      value: ReactComponent
    }
    | {
      tag: "root"
      value: undefined
    }

  interface Element {
    type: ElementType
    props: Record<string, any>
    children: JSX.Element[]
  }

  interface IntrinsicAttributes {
    id?: string
    className?: string

    [key: string]: any
  }

  interface IntrinsicElements {
    [key: string]: IntrinsicAttributes
  }
}

type Child = ReactElement | string | number | boolean | null | undefined

type Props = { children: Child | Child[] } & Record<string, any>

const createJSXElement = (type: string | ReactComponent, props?: Props | null): ReactElement => {
  const children = props?.children instanceof Array ? props.children : [props?.children]
  return createElement(type, props, ...children)
}

const Fragment = (props: { children: JSX.Element }) => props.children

export { createJSXElement as jsx, createJSXElement as jsxs, createJSXElement as jsxDEV, Fragment }
