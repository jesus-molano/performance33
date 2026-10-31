import { BLOCK_TYPE_META } from '../../../../config/blockTypes'
import { useDisclosure } from '../../../../hooks'
import { cn } from '../../../../lib/cn'
import { useAppActions } from '../../../../store'
import type { Block, Day } from '../../../../types'
import { useBlockActions } from '../../hooks/useBlockActions'
import { useSortableItem } from '../../hooks/useSortableItem'
import { useEditorUi } from '../../state/editorUiStore'
import type { WeekContext } from '../../types'
import { VisibleTextField } from '../common/VisibleTextField'
import { ExerciseList } from '../exercises/ExerciseList'
import { BlockHeaderBar } from './BlockHeaderBar'
import { BlockNoteField } from './BlockNoteField'
import { BlockParamsEditor } from './BlockParamsEditor'
import { BlockTypePicker } from './BlockTypePicker'
import { CopyToDayModal } from './CopyToDayModal'
import { SupersetHint } from './SupersetHint'

export interface BlockCardProps {
  block: Block
  blockIndex: number
  day: Day
  days: Day[]
  weeks: WeekContext
}

export function BlockCard({ block, blockIndex, day, days, weeks }: BlockCardProps) {
  const { updateBlock } = useAppActions()
  const { setNodeRef, style, isDragging, handle } = useSortableItem(block.id)
  const collapsed = useEditorUi((s) => !!s.collapsedBlocks[block.id])
  const toggleBlock = useEditorUi((s) => s.toggleBlock)
  const typePicker = useDisclosure()
  const copyModal = useDisclosure()
  const api = useBlockActions({
    blockId: block.id,
    dayId: day.id,
    blockIndex,
    blockCount: day.blocks.length,
    dayCount: days.length,
    onChangeType: typePicker.open,
    onCopyToDay: copyModal.open,
  })
  const meta = BLOCK_TYPE_META[block.type]

  return (
    <article
      ref={setNodeRef}
      style={style}
      aria-label={`Bloque ${blockIndex + 1}`}
      className={cn(
        'rounded-2xl border bg-surface shadow-card transition-shadow',
        meta.muted ? 'border-dashed border-line-strong' : 'border-line',
        isDragging && 'shadow-pop ring-2 ring-brand-strong/30',
      )}
    >
      <BlockHeaderBar
        block={block}
        collapsed={collapsed}
        onToggle={() => toggleBlock(block.id)}
        handle={handle}
        menuItems={api.menuItems}
      />
      {!collapsed && (
        <div className="flex flex-col gap-4 border-t border-line px-3 py-4 md:px-4">
          <BlockParamsEditor block={block} />
          {meta.allowsText && (
            <VisibleTextField
              multiline
              label="Descripción (texto libre)"
              value={block.text}
              placeholder={'Ej.\n5′ bici suave\n2 rondas: 10 sentadillas, 10 puentes de glúteo, 5 flexiones'}
              onChange={(text) => updateBlock(block.id, { text })}
            />
          )}
          <SupersetHint block={block} />
          <ExerciseList block={block} blockIndex={blockIndex} dayBlocks={day.blocks} weeks={weeks} />
          <BlockNoteField block={block} />
        </div>
      )}
      <BlockTypePicker open={typePicker.isOpen} onClose={typePicker.close} current={block.type} onPick={api.changeType} />
      <CopyToDayModal
        open={copyModal.isOpen}
        onClose={copyModal.close}
        days={days.filter((d) => d.id !== day.id)}
        onPick={api.copyToDay}
      />
    </article>
  )
}
