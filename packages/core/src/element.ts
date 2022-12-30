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

export type ReactElement = {
  type: ElementType
  props: Record<string, any>
  children: ReactElement[]
}

export type ReactComponent<Props extends Record<string, any> = any> = (props: Props) => ReactElement

const createTextElement = (text: string): ReactElement => {
  return {
    type: {
      tag: "text",
      value: text
    },
    props: {},
    children: []
  }
}

export const createElement = (
  type: string | ReactComponent,
  props?: Record<string, any> | null,
  ...children: (ReactElement | string | boolean | null | undefined)[]
): ReactElement => {
  const isComponent = type instanceof Function
  return {
    // @ts-ignore
    type: {
      tag: isComponent ? "component" : "node",
      value: type
    },
    props: props ?? {},
    children: children
      .filter((child) => typeof child === "string" || typeof child === "object")
      .map((child) =>
        typeof child === "string" ? createTextElement(child) : child
      ) as ReactElement[]
  }
}
