// Coalesces rapid edits of the same field into one undo step.

export interface UndoGrouper {
  /** True when this edit should be merged into the previous undo step. */
  shouldMerge: (key: string | undefined) => boolean
  /** Next edit always starts a new step (after undo/redo, blur, structural changes). */
  reset: () => void
}

export function createUndoGrouper(windowMs: number, now: () => number = Date.now): UndoGrouper {
  let lastKey: string | undefined
  let lastAt = 0
  return {
    shouldMerge: (key) => {
      const at = now()
      const merge = key !== undefined && key === lastKey && at - lastAt < windowMs
      lastKey = key
      lastAt = at
      return merge
    },
    reset: () => {
      lastKey = undefined
    },
  }
}

/** Group key: same scope + same id + same set of fields. */
export function groupKey(scope: string, id: string, patch: object): string {
  return `${scope}:${id}:${Object.keys(patch).sort().join(',')}`
}
