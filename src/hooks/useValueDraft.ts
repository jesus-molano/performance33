import { useState } from 'react'

export interface ValueDraftOptions<T> {
  /** Value in the store. */
  value: T
  format: (value: T) => string
  /** Parsed value, or undefined while the text is not a valid value yet ('' for weeks, '-'…). */
  parse: (text: string) => T | undefined
  onCommit: (value: T) => void
  /** Changing it (e.g. the unit) re-formats the field from the store value. */
  resetKey?: string
}

export interface ValueDraft {
  text: string
  onChange: (text: string) => void
  /** Shows the store value again (call on blur, drops half-typed text). */
  onBlur: () => void
}

/**
 * Free typing for number-like fields bound to the store: the half-typed text ('1,', '') stays in
 * the field while only valid values are committed. Follows outside changes (undo, chips, other tab).
 */
export function useValueDraft<T>({ value, format, parse, onCommit, resetKey = '' }: ValueDraftOptions<T>): ValueDraft {
  const [text, setText] = useState(() => format(value))
  const [synced, setSynced] = useState({ value, resetKey })
  if (synced.value !== value || synced.resetKey !== resetKey) {
    setSynced({ value, resetKey })
    if (synced.resetKey !== resetKey || parse(text) !== value) setText(format(value))
  }

  return {
    text,
    onChange: (next) => {
      setText(next)
      const parsed = parse(next)
      if (parsed !== undefined && parsed !== value) onCommit(parsed)
    },
    onBlur: () => setText(format(value)),
  }
}
