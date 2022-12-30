type ReactFiber = {
  dom?: Node | null
  parent?: ReactElement | null
  child?: ReactElement | null
  sibling?: ReactElement | null
  alternate?: ReactElement | null
  effectTag?: "UPDATE" | "PLACEMENT" | "DELETION"
  states?: ReactStateHook[]
  effects?: ReactEffectHook[]
}

type ReactStateHook<T = any> = { state: T; queue: ReactSetState<T>[] }
type ReactSetState<T> = (prev: T) => T

type ReactEffectHook = { handler: () => () => void; cleanup?: () => void }

type ReactElementProps = Record<string, any> & { children: ReactElement[] }

export type ReactElement = {
  type: string | ReactComponent
  props: ReactElementProps
} & ReactFiber

export type ReactComponent<Props = unknown> = (props: Props) => ReactElement

type Fiber = ReactElement | null | undefined

const createTextElement = (text: string): ReactElement => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

export const createElement = (
  type: string,
  props: object | null,
  ...children: ReactElement[]
): ReactElement => {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  }
}

const isEvent = (key: string) => key.startsWith("on")
const isAttribute = (key: string) => key !== "children" && !isEvent(key)

const createDOM = (fiber: ReactElement) => {
  if (typeof fiber.type !== "string") return

  const dom =
    fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type)

  updateDOM(dom, {} as ReactElementProps, fiber.props)

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

let wipRoot: Fiber = null // root of a fiber tree
let currentRoot: Fiber = null // last committed fiber tree
let nextUnitOfWork: Fiber = null
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

const commitWork = (fiber: Fiber) => {
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
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, parentDOM)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const commitDeletion = (fiber: Fiber, parentDOM: Node) => {
  // find the child fiber with a DOM node
  if (fiber?.dom) {
    parentDOM.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber?.child, parentDOM)
  }
}

const reconcileChildren = (wipFiber: ReactElement, elements: ReactElement[]) => {
  let index = 0
  let prevSibling: Fiber = null
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]

    let newFiber: Fiber = null

    // if the old fiber and the new element have the same type,
    // we keep the DOM node and just update it with the new props
    const isSameType = oldFiber && element && element.type == oldFiber.type
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

let wipFiber: Fiber = null
let stateHookIndex = -1
let effectHookIndex = -1

const updateFunctionComponent = (fiber: ReactElement) => {
  wipFiber = fiber
  stateHookIndex = 0
  wipFiber.states = []

  const component = fiber.type as ReactComponent
  const children = [component(fiber.props)]
  reconcileChildren(fiber, children)
}

const updateHostComponent = (fiber: ReactElement) => {
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber)
  }
  reconcileChildren(fiber, fiber.props.children.flat())
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

  let nextFiber: Fiber = fiber
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
    type: "RENDER_ROOT_UNIT",
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

export const useState = <T>(initial: T): [T, (setter: ReactSetState<T>) => void] => {
  // when calling useState, check if an old hook exists
  const oldHook =
    wipFiber &&
    wipFiber.alternate &&
    wipFiber.alternate.states &&
    wipFiber.alternate.states[stateHookIndex]

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  } as ReactStateHook<T>

  const actions = (oldHook ? oldHook.queue : []) as ReactSetState<T>[]
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = (action: ReactSetState<T>) => {
    hook.queue.push(action)
    wipRoot = {
      type: "RENDER_ROOT_UNIT",
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber?.states?.push(hook)
  stateHookIndex++

  return [hook.state, setState]
}

export const useEffect = (handler: () => (() => void) | void) => {
  const oldHook =
    wipFiber &&
    wipFiber.alternate &&
    wipFiber.alternate.effects &&
    wipFiber.alternate.effects[effectHookIndex]

  const hook = {
    handler: oldHook ? oldHook.handler : handler,
    cleanup: oldHook ? oldHook.cleanup : null
  } as ReactEffectHook

  // TODO
  const cleanup = handler()
  if (cleanup) hook.cleanup = cleanup

  wipFiber?.effects?.push(hook)

  effectHookIndex++
}
