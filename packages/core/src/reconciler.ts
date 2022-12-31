import { lifecycle } from "./lifecycle"
import type { ReactComponent, ReactElement } from "./element"

export interface ReactFiber {
  element: ReactElement
  domNode?: Node | null
  parent?: ReactFiber | null
  child?: ReactFiber | null
  sibling?: ReactFiber | null
  previous?: ReactFiber | null
  operation?: "CREATION" | "UPDATE" | "DELETION"
}

declare global {
  interface Node {
    __fiber?: ReactFiber
  }
}

const createDOMNode = (fiber: ReactFiber) => {
  const elementType = fiber.element.type
  let domNode: Node =
    elementType.tag === "text"
      ? document.createTextNode(elementType.value)
      : document.createElement(elementType.value as string)

  updateDOMNode(domNode, {}, fiber.element.props)

  // for debug purpose
  domNode.__fiber = fiber

  return domNode
}

const isEvent = (key: string) => key.startsWith("on")
const isAttribute = (key: string) => key !== "children" && !isEvent(key)
const updateDOMNode = (
  node: Node,
  prevProps: Record<string, any>,
  nextProps: Record<string, any>
) => {
  // remove old event listeners
  // if event removed or event handler changed
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().slice(2)
      node.removeEventListener(eventType, prevProps[name])
    })

  // add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter((key) => prevProps[key] !== nextProps[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().slice(2)
      node.addEventListener(eventType, nextProps[name])
    })

  // remove old properties
  Object.keys(prevProps)
    .filter(isAttribute)
    .filter((key) => !(key in nextProps))
    .forEach((key) => ((node as any)[key] = ""))

  // update new properties
  Object.keys(nextProps)
    .filter(isAttribute)
    .filter((key) => prevProps[key] !== nextProps[key])
    .forEach((key) => ((node as any)[key] = nextProps[key]))
}

const workLoop = (deadline: IdleDeadline) => {
  // yield when the browser is busy
  let shouldYield = false

  while (lifecycle.nextUnitOfWork && !shouldYield) {
    lifecycle.nextUnitOfWork = performUnitOfWork(lifecycle.nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  // when there's no more fiber work unit, then the entire
  // root fiber tree is done, so we commit the root fiber
  if (!lifecycle.nextUnitOfWork && lifecycle.wipRootFiber) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

const performUnitOfWork = (fiber: ReactFiber) => {
  lifecycle.onBeforeWork?.(fiber)
  const isComponent = fiber.element.type.tag === "component"
  if (isComponent) {
    const component = fiber.element.type.value as ReactComponent
    reconcileChildren(fiber, [component(fiber.element.props)])
  } else {
    // create the actual DOM node if the fiber doesn't have one
    if (!fiber.domNode) {
      fiber.domNode = createDOMNode(fiber)
    }
    reconcileChildren(fiber, fiber.element.children)
  }

  // if the current working fiber has a child,
  // then work on its child next
  if (fiber.child) return fiber.child

  // if the current working fiber doesn't have any children,
  // then work on its sibling next, otherwise working on
  // the sibling of its parent next
  let nextFiber: ReactFiber | null = fiber
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling
    nextFiber = nextFiber.parent ?? null
  }
  return null
}

const commitRoot = () => {
  lifecycle.deletions?.splice(0).forEach(commitWork)
  commitWork(lifecycle.wipRootFiber?.child ?? null)
  lifecycle.committedRootFiber = lifecycle.wipRootFiber
  lifecycle.wipRootFiber = null
}

const commitWork = (fiber: ReactFiber | null) => {
  if (!fiber) return

  // fibers of function components do not have DOM nodes,
  // so we need to find its parent fiber with a DOM node
  let parentFiber: ReactFiber | null = fiber.parent ?? null
  while (!parentFiber?.domNode) {
    parentFiber = parentFiber?.parent ?? null
  }

  const parentNode = parentFiber.domNode

  if (fiber.operation === "CREATION" && fiber.domNode != null) {
    parentNode.appendChild(fiber.domNode)
  } else if (fiber.operation === "UPDATE" && fiber.domNode != null) {
    updateDOMNode(fiber.domNode, fiber.previous!.element.props, fiber.element.props)
  } else if (fiber.operation === "DELETION") {
    commitDeletion(fiber, parentNode)
    return
  }

  commitWork(fiber.child ?? null)
  commitWork(fiber.sibling ?? null)
}

const commitDeletion = (fiber: ReactFiber, parentNode: Node) => {
  if (fiber.domNode) {
    parentNode.removeChild(fiber.domNode)
  } else {
    commitDeletion(fiber.child!, parentNode)
  }
}

const reconcileChildren = (fiber: ReactFiber, elements: ReactElement[]) => {
  let index = 0

  // the last rendered child of the fiber to be compared with
  // the new fiber's child elements
  let oldChild = fiber.previous?.child ?? null
  let prevSibling: ReactFiber | null = null

  while (index < elements.length || oldChild !== null) {
    const element: ReactElement | undefined = elements[index]
    let newFiber: ReactFiber | null = null

    const isSameType =
      oldChild &&
      element &&
      element.type.tag === oldChild.element.type.tag &&
      element.type.value === oldChild.element.type.value

    // if the old fiber and the new element have the same type,
    // we keep the DOM node and just update it with the new props
    if (isSameType) {
      newFiber = {
        element: {
          type: oldChild!.element.type,
          props: element.props,
          children: element.children
        },
        domNode: oldChild?.domNode,
        parent: fiber,
        previous: oldChild,
        operation: "UPDATE"
      }
    }

    // if the type is different and there's a new element,
    // we create the new DOM node
    if (element && !isSameType) {
      newFiber = {
        element,
        parent: fiber,
        operation: "CREATION"
      }
    }

    // if the type is different and there's an old fiber,
    // we remove the old DOM node
    if (oldChild && !isSameType) {
      oldChild.operation = "DELETION"
      lifecycle.deletions?.push(oldChild)
    }

    // move to the next old child of the current fiber
    if (oldChild) oldChild = oldChild.sibling ?? null

    // correctly link the newly created fiber
    if (index === 0) {
      fiber.child = newFiber
    } else {
      if (element) prevSibling!.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

export const render = (element: ReactElement, container: Node) => {
  lifecycle.requestRender({
    element: {
      type: { tag: "root", value: undefined },
      props: {},
      children: [element]
    },
    domNode: container,
    previous: lifecycle.committedRootFiber
  })
}
