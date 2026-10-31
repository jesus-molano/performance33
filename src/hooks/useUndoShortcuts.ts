import { useEffect } from 'react'
import { redo, undo } from '../store/history'

/** Inputs whose value is NOT bound to the store opt out of store undo with this attribute. */
export const NATIVE_UNDO_ATTRIBUTE = 'data-native-undo'

type HistoryCommand = 'undo' | 'redo' | null

function commandFor(event: KeyboardEvent): HistoryCommand {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return null
  const key = event.key.toLowerCase()
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
  if (key === 'y' && !event.shiftKey) return 'redo'
  return null
}

function wantsNativeUndo(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(`[${NATIVE_UNDO_ATTRIBUTE}]`) !== null
}

/**
 * Global Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y → store undo/redo. Store-bound inputs are
 * handled consistently (the store reverts the value). Local-state inputs (search boxes, modal
 * forms) keep native undo: Modal and Input with `nativeUndo` mark themselves with data-native-undo.
 */
export function useUndoShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const command = commandFor(event)
      if (!command || wantsNativeUndo(event.target)) return
      event.preventDefault()
      if (command === 'undo') undo()
      else redo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
