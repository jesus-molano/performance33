import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { cn } from '@/lib/cn'
import type { Block, Day } from '@/types'
import { BLOCK_TEXT_PLACEHOLDER } from '@/features/editor/config'
import { useBlockCard } from '@/features/editor/hooks/useBlockCard'
import { useSortableItem } from '@/features/editor/hooks/useSortableItem'
import { VisibleTextField } from '@/features/editor/components/common/VisibleTextField'
import { ExerciseList } from '@/features/editor/components/exercises/ExerciseList'
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
}

export function BlockCard({ block, blockIndex, day }: BlockCardProps) {
  const { setNodeRef, style, isDragging, handle } = useSortableItem(block.id)
  const card = useBlockCard(block, blockIndex, day)
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
        collapsed={card.collapsed}
        onToggle={card.toggle}
        onTitleChange={card.fields.setTitle}
        handle={handle}
        menuItems={card.actions.menuItems}
      />
      {!card.collapsed && (
        <div className="flex flex-col gap-4 border-t border-line px-3 py-4 md:px-4">
          <BlockParamsEditor block={block} onParamsChange={card.fields.setParams} />
          {meta.allowsText && (
            <VisibleTextField
              multiline
              label="Descripción (texto libre)"
              value={block.text}
              placeholder={BLOCK_TEXT_PLACEHOLDER}
              onChange={card.fields.setText}
            />
          )}
          <SupersetHint block={block} onSwitchToCircuit={() => card.fields.changeType('circuit')} />
          <ExerciseList block={block} blockIndex={blockIndex} dayBlocks={day.blocks} />
          <BlockNoteField note={block.note} onChange={card.fields.setNote} />
        </div>
      )}
      <BlockTypePicker open={card.typePicker.isOpen} onClose={card.typePicker.close} current={block.type} onPick={card.actions.changeType} />
      <CopyToDayModal open={card.copyModal.isOpen} onClose={card.copyModal.close} days={card.otherDays} onPick={card.actions.copyToDay} />
    </article>
  )
}
