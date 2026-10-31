export interface Debounced {
  (): void
  /** Run now if a call is pending. */
  flush: () => void
  cancel: () => void
}

/** Trailing debounce of a no-argument function, with flush/cancel. */
export function debounce(fn: () => void, waitMs: number): Debounced {
  let timer: ReturnType<typeof setTimeout> | null = null
  const cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  const flush = () => {
    if (!timer) return
    cancel()
    fn()
  }
  const debounced = () => {
    cancel()
    timer = setTimeout(() => {
      timer = null
      fn()
    }, waitMs)
  }
  return Object.assign(debounced, { flush, cancel })
}
