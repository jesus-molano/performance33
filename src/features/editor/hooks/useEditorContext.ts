import { createContext, useContext } from 'react'
import type { Day } from '@/types'
import type { WeekContext } from '@/features/editor/types'

export interface EditorContextValue {
  /** All days of the open program (copy-to-day targets). */
  days: Day[]
  weeks: WeekContext
}

export const EditorContext = createContext<EditorContextValue | null>(null)

/** Program-wide values for deep editor components (set once by ProgramEditor). */
export function useEditorContext(): EditorContextValue {
  const value = useContext(EditorContext)
  if (!value) throw new Error('useEditorContext must be used inside ProgramEditor')
  return value
}
