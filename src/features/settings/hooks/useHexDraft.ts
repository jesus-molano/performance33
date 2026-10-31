import { useState } from 'react'
import { isHexColor } from '@/lib/color'

export interface HexDraftApi {
  draft: string
  invalid: boolean
  change: (text: string) => void
}

/**
 * Free-typing hex field: keeps the half-typed text locally and only commits valid '#rrggbb'.
 * Follows outside changes (colour picker, undo) of `value`.
 */
export function useHexDraft(value: string, onCommit: (hex: string) => void): HexDraftApi {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    setSynced(value)
    setDraft(value)
  }

  const change = (text: string) => {
    const next = text.startsWith('#') ? text : `#${text}`
    setDraft(next)
    if (isHexColor(next)) onCommit(next.toLowerCase())
  }

  return { draft, invalid: !isHexColor(draft), change }
}
