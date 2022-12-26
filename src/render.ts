type ReactFiber = {
  dom?: Node | null
  parent?: ReactElement | null
  child?: ReactElement | null
  sibling?: ReactElement | null
  alternate?: ReactElement | null
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION"
}

type ReactElementProps = Record<string, any> & { children: ReactElement[] }

export type ReactElement = {
  type: string | ReactComponent
  props: ReactElementProps
} & ReactFiber

export type ReactComponent<Props = unknown> = (props: Props) => ReactElement

type FiberWork = ReactElement | null | undefined

type CreateElement = (
  type: string,
  props: object | null,
  ...children: ReactElement[]
) => ReactElement
type CreateTextElement = (text: string) => ReactElement

const createTextElement: CreateTextElement = text => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

export const createElement: CreateElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat()
        .map(child => (typeof child === "object" ? child : createTextElement(child)))
    }
  }
}

const isEvent = (key: string) => key.startsWith("on")
const isAttribute = (key: string) => key !== "children" && !isEvent(key)

const createDOM = (element: ReactElement) => {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  updateDOM(dom, {} as ReactElementProps, element.props)

  return dom
}

const updateDOM = (dom: Node, prevProps: ReactElementProps, nextProps: ReactElementProps) => {
  // remove old event listeners
  // if event removed or event handler changed
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || prevProps[key] !== nextProps[key])
    .forEach(name => {
      const eventType = name.toLowerCase().slice(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(key => prevProps[key] !== nextProps[key])
    .forEach(name => {
      const eventType = name.toLowerCase().slice(2)
      dom.addEventListener(eventType, nextProps[name])
    })

  // remove old properties
  Object.keys(prevProps)
    .filter(isAttribute)
    .filter(key => !(key in nextProps))
    .forEach(key => ((dom as any)[key] = ""))

  // update new properties
  Object.keys(nextProps)
    .filter(isAttribute)
    .filter(key => prevProps[key] !== nextProps[key])
    .forEach(key => ((dom as any)[key] = nextProps[key]))
}

let wipRoot: FiberWork = null
let currentRoot: FiberWork = null
let nextUnitOfWork: FiberWork = null
let deletions: ReactElement[] = []

const workLoop = (deadline: IdleDeadline) => {
  let shouldYield = false

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

const commitRoot = () => {
  deletions.forEach(commitWork)
  commitWork(wipRoot?.child)
  currentRoot = wipRoot
  wipRoot = null
}

const commitWork = (fiber: FiberWork) => {
  if (!fiber) return

  // fibers of function components do not have DOM nodes
  // find the parent of a DOM node
  let parentFiber = fiber.parent
  while (!parentFiber?.dom) {
    parentFiber = parentFiber?.parent
  }
  const parentDOM = parentFiber.dom

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    parentDOM.appendChild(fiber.dom)
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDOM(fiber.dom, fiber.alternate!.props, fiber.props)
  } else if (fiber.effectTag === "DELETION" && fiber.dom != null) {
    commitDeletion(fiber, parentDOM)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const commitDeletion = (fiber: FiberWork, parentDOM: Node) => {
  // find the child fiber with a DOM node
  if (fiber?.dom) {
    parentDOM.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber?.child, parentDOM)
  }
}

const reconcileChildren = (wipFiber: ReactElement, elements: ReactElement[]) => {
  let index = 0
  let prevSibling: FiberWork = null
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]

    let newFiber: FiberWork = null

    // if the old fiber and the new element have the same type,
    // we keep the DOM node and just update it with the new props
    const isSameType = oldFiber && element && element.type === oldFiber.type
    if (isSameType) {
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      }
    }

    // if the type is different and there's a new element,
    // we create the new DOM node
    if (element && !isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      }
    }

    // if the type is different and there's an old fiber,
    // we remove the old DOM node
    if (oldFiber && !isSameType) {
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling!.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

const updateFunctionComponent = (fiber: ReactElement) => {
  const component = fiber.type as ReactComponent
  const children = [component(fiber.props)]
  reconcileChildren(fiber, children)
}

const updateHostComponent = (fiber: ReactElement) => {
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

const performUnitOfWork = (fiber: ReactElement) => {
  const isFunctionComponent = fiber.type instanceof Function

  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) {
    return fiber.child
  }

  let nextFiber: FiberWork = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return null
}

export const render = (element: ReactElement, container: Node) => {
  wipRoot = {
    type: "ROOT",
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = wipRoot
}
