import { useEffect, useRef } from 'react'
import { DISPLAY_KEYS, type DisplayKeyAction } from '@/features/display/config/display'

export type DisplayShortcutHandlers = Partial<Record<DisplayKeyAction, () => void>>

const isFormField = (target: EventTarget | null) =>
  target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)

function findAction(key: string): DisplayKeyAction | null {
  const actions = Object.keys(DISPLAY_KEYS) as DisplayKeyAction[]
  return actions.find((action) => (DISPLAY_KEYS[action] as readonly string[]).includes(key)) ?? null
}

/** ←/→ change day, F fullscreen, +/- text size. Ignored while a picker has focus. */
export function useDisplayShortcuts(handlers: DisplayShortcutHandlers): void {
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || isFormField(event.target)) return
      const action = findAction(event.key)
      const handler = action ? latest.current[action] : undefined
      if (!handler) return
      event.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
