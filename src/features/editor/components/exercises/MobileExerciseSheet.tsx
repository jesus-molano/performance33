import { Button, Modal } from '@/components/ui'
import type { Program } from '@/types'
import { useExpandedRowSheet } from '@/features/editor/hooks/useExpandedRowSheet'
import { ExerciseEditor } from './ExerciseEditor'

/** On phones the open row is edited in a bottom sheet with big inputs instead of inline. */
export function MobileExerciseSheet({ program }: { program: Program }) {
  const sheet = useExpandedRowSheet(program)
  if (!sheet) return null
  return (
    <Modal
      open
      nativeUndo={false}
      onClose={sheet.close}
      size="lg"
      title={sheet.title}
      footer={
        <Button fullWidth size="lg" onClick={sheet.close}>
          Listo
        </Button>
      }
    >
      <ExerciseEditor
        entry={sheet.row.exercise}
        blockId={sheet.row.block.id}
        index={sheet.row.exerciseIndex}
        showSets={sheet.showSets}
      />
    </Modal>
  )
}
