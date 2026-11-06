import { useState } from 'react'
import { resolveScreenName } from '@/features/screens/utils/panel'

export interface ScreenNameDraft {
  text: string
  onChange: (text: string) => void
  /** Saves the text if it changed (on blur or Enter); a blank one goes back to the default name. */
  commit: () => void
}

/** A screen's name while it is typed: saved once, not on every key. Follows renames from other coaches. */
export function useScreenNameDraft(id: number, name: string, onCommit: (name: string) => void): ScreenNameDraft {
  const [text, setText] = useState(name)
  const [synced, setSynced] = useState(name)
  if (synced !== name) {
    setSynced(name)
    setText(name)
  }

  const commit = () => {
    const next = resolveScreenName(text, id)
    if (next === name) setText(name)
    else onCommit(next)
  }

  return { text, onChange: setText, commit }
}
