import { Button, Modal } from '../../../../components/ui'
import { useIsMobile } from '../../../../hooks'
import { blockShowsSets } from '../../../../lib/blocks'
import { getExerciseLabels } from '../../../../lib/format'
import type { Program } from '../../../../types'
import { useEditorUi } from '../../state/editorUiStore'
import type { WeekContext } from '../../types'
import { findRowInProgram } from '../../utils'
import { ExerciseEditor } from './ExerciseEditor'

export interface MobileExerciseSheetProps {
  program: Program
  weeks: WeekContext
}

/** On phones the open row is edited in a bottom sheet with big inputs instead of inline. */
export function MobileExerciseSheet({ program, weeks }: MobileExerciseSheetProps) {
  const isMobile = useIsMobile()
  const expandedId = useEditorUi((s) => s.expandedExerciseId)
  const closeRow = useEditorUi((s) => s.closeRow)
  const row = isMobile && expandedId ? findRowInProgram(program, expandedId) : null
  if (!row) return null

  const label = getExerciseLabels(row.day.blocks, row.blockIndex)[row.index]
  const name = row.entry.name.trim() || 'Nuevo ejercicio'
  return (
    <Modal
      open
      onClose={closeRow}
      size="lg"
      title={label ? `${label} · ${name}` : name}
      footer={
        <Button fullWidth size="lg" onClick={closeRow}>
          Listo
        </Button>
      }
    >
      <ExerciseEditor
        entry={row.entry}
        blockId={row.block.id}
        index={row.index}
        showSets={blockShowsSets(row.block.type)}
        weeks={weeks}
      />
    </Modal>
  )
}
