// Going to another page starts at its top; going back keeps where the browser left it.

const ENTRY_KEY = 'p33Visited'

/** Marks the current history entry. True when it was new: Back and Forward land on entries already marked. */
export function markHistoryEntry(): boolean {
  const state: unknown = window.history.state
  if (typeof state === 'object' && state !== null && ENTRY_KEY in state) return false
  window.history.replaceState({ ...(state as object | null), [ENTRY_KEY]: true }, '')
  return true
}
