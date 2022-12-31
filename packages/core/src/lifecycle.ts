import { ReactFiber } from "./reconciler"

export interface Lifecycle {
  wipRootFiber: ReactFiber | null
  committedRootFiber: ReactFiber | null
  nextUnitOfWork: ReactFiber | null
  deletions: ReactFiber[] | null
  requestRender(fiber: ReactFiber): void
  onBeforeWork?(fiber: ReactFiber): void
}

export let lifecycle: Lifecycle = {
  wipRootFiber: null,
  committedRootFiber: null,
  nextUnitOfWork: null,
  deletions: null,
  requestRender(fiber) {
    lifecycle.wipRootFiber = fiber
    lifecycle.deletions = []
    lifecycle.nextUnitOfWork = lifecycle.wipRootFiber
  }
}
