import { lifecycle } from "@proto-react/core"
import type { ReactFiber } from "@proto-react/core"

declare module "@proto-react/core" {
  interface ReactFiber {
    hooks?: HookState[] | null
  }
}

type HookState = StateHookState

type StateHookAction<T> = T | ((prev: T) => T)
type StateHookState<T = any> = {
  tag: "state"
  value: {
    state: T
    queue: StateHookAction<T>[]
  }
}

let wipComponentFiber: ReactFiber | null = null
let hookIndex = 0

lifecycle.onBeforeWork = (fiber) => {
  if (fiber.element.type.tag === "component") {
    wipComponentFiber = fiber
    hookIndex = 0
    wipComponentFiber.hooks = []
  }
}

export const useState = <T>(initial: T) => {
  const oldHook = wipComponentFiber?.previous?.hooks?.at(hookIndex)
  const hook: StateHookState<T> = {
    tag: "state",
    value: {
      state: oldHook?.value.state ?? initial,
      queue: []
    }
  }

  const actions: StateHookAction<T>[] = oldHook?.value.queue ?? []
  actions.forEach((action) => {
    hook.value.state = action instanceof Function ? action(hook.value.state) : action
  })

  const setState = (action: StateHookAction<T>) => {
    hook.value.queue.push(action)
    lifecycle.requestRender({
      element: lifecycle.committedRootFiber!.element,
      domNode: lifecycle.committedRootFiber!.domNode,
      previous: lifecycle.committedRootFiber
    })
  }

  wipComponentFiber?.hooks?.push(hook)
  hookIndex++

  return [hook.value.state, setState] as const
}
