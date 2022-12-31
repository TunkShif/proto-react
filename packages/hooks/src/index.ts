import { lifecycle } from "@proto-react/core"
import type { ReactFiber } from "@proto-react/core"

declare module "@proto-react/core" {
  interface ReactFiber {
    hooks?: HookState[] | null
    pendingEffects?: EffectHookState[]
  }
}

type HookState = StateHookState | EffectHookState

type StateHookAction<T> = T | ((prev: T) => T)
type StateHookState<T = any> = {
  tag: "state"
  value: {
    state: T
    queue: StateHookAction<T>[]
  }
}

type EffectHookState = {
  tag: "effect"
  value: {
    callback: () => Function | void
    dependencies: any[]
    cleanup?: Function
  }
}

let wipComponentFiber: ReactFiber | null = null
let hookIndex = 0

lifecycle.onBeforeWork = (fiber) => {
  if (fiber.element.type.tag === "component") {
    wipComponentFiber = fiber
    hookIndex = 0
    wipComponentFiber.hooks = []
    wipComponentFiber.pendingEffects = []
  }
}

lifecycle.onBeforeRendered = (fiber) => {
  if (fiber.element.type.tag === "component") {
    fiber.pendingEffects?.forEach((hook) => hook.value.cleanup?.())
    fiber.pendingEffects?.forEach((hook) => {
      hook.value.cleanup = hook.value.callback() ?? undefined
    })
    fiber.pendingEffects = []
  }
}

lifecycle.onBeforeUnmount = (fiber) => {
  if (fiber.element.type.tag === "component") {
    fiber.hooks?.forEach((hook) => {
      if (hook.tag === "effect") hook.value.cleanup?.()
    })
    fiber.hooks = undefined
  }
}

const dependenciesChanged = (prev: any[] | null | undefined, next: any[]) => {
  return !prev || prev.length !== next.length || prev.some((v, i) => v !== next[i])
}

export const useState = <T>(initial: T) => {
  const oldHook = wipComponentFiber?.previous?.hooks?.at(hookIndex) as StateHookState<T> | undefined
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

export const useEffect = (callback: () => Function | void, dependencies: any[]) => {
  const oldHook = wipComponentFiber?.previous?.hooks?.at(hookIndex) as EffectHookState | undefined
  const hook: EffectHookState = {
    tag: "effect",
    value: {
      callback: oldHook?.value.callback ?? callback,
      dependencies: oldHook?.value.dependencies ?? []
    }
  }

  if (dependenciesChanged(oldHook?.value.dependencies, dependencies))
    wipComponentFiber?.pendingEffects?.push(hook)

  wipComponentFiber?.hooks?.push(hook)
  hookIndex++
}
