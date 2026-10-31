import { useIsMobile } from '@/hooks'
import { blockShowsSets } from '@/lib/blocks'
import { getExerciseLabels } from '@/lib/format'
import { locateExerciseInProgram, type ExerciseContext } from '@/lib/programTree'
import type { Program } from '@/types'
import { NEW_EXERCISE_TITLE } from '@/features/editor/config'
import { useEditorUi } from '@/features/editor/store/editorUiStore'

export interface ExpandedRowSheet {
  row: ExerciseContext
  title: string
  showSets: boolean
  close: () => void
}

/** On phones: the open row (if any) to edit in the bottom sheet, with its 'A1 · Nombre' title. */
export function useExpandedRowSheet(program: Program): ExpandedRowSheet | null {
  const isMobile = useIsMobile()
  const expandedId = useEditorUi((s) => s.expandedExerciseId)
  const close = useEditorUi((s) => s.closeRow)
  const row = isMobile && expandedId ? locateExerciseInProgram(program, expandedId) : null
  if (!row) return null
  const label = getExerciseLabels(row.day.blocks, row.blockIndex)[row.exerciseIndex]
  const name = row.exercise.name.trim() || NEW_EXERCISE_TITLE
  return { row, title: label ? `${label} · ${name}` : name, showSets: blockShowsSets(row.block.type), close }
}
