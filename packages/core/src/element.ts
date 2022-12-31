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

const createTextElement = (text: string | number): ReactElement => {
  return {
    type: {
      tag: "text",
      value: `${text}`
    },
    props: {},
    children: []
  }
}

export const createElement = (
  type: string | ReactComponent,
  props?: Record<string, any> | null,
  ...children: (ReactElement | number | string | boolean | null | undefined)[]
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
      .flat()
      .filter(
        (child) =>
          typeof child === "number" || typeof child === "string" || typeof child === "object"
      )
      .map((child) =>
        typeof child === "string" || typeof child === "number" ? createTextElement(child) : child
      ) as ReactElement[]
  }
}
