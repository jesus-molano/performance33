import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge, DropdownMenu, HelpTip, IconButton, type MenuItem } from '../../../../components/ui'
import { BLOCK_TYPE_META } from '../../../../config/blockTypes'
import { getAutoBlockTitle } from '../../../../lib/blocks'
import { cn } from '../../../../lib/cn'
import { getBlockSummary } from '../../../../lib/format'
import { useAppActions } from '../../../../store'
import type { Block } from '../../../../types'
import type { DragHandleBindings } from '../../hooks/useSortableItem'
import { InlineInput } from '../common/InlineInput'
import { DragHandle } from '../dnd/DragHandle'

export interface BlockHeaderBarProps {
  block: Block
  collapsed: boolean
  onToggle: () => void
  handle: DragHandleBindings
  menuItems: MenuItem[]
}

/** Grip · type icon · editable title (auto from type) · summary · collapse · '⋯'. */
export function BlockHeaderBar({ block, collapsed, onToggle, handle, menuItems }: BlockHeaderBarProps) {
  const { updateBlock } = useAppActions()
  const meta = BLOCK_TYPE_META[block.type]
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-1 p-2 md:gap-2 md:p-3">
      <DragHandle handle={handle} itemLabel="bloque" />
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          meta.muted ? 'bg-fg/5 text-fg-muted' : 'bg-ink text-brand',
        )}
        title={meta.label}
      >
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <InlineInput
            aria-label="Título del bloque"
            value={block.title}
            placeholder={getAutoBlockTitle(block)}
            onValueChange={(title) => updateBlock(block.id, { title })}
          />
          {meta.acronym && (
            <span className="hidden shrink-0 items-center gap-1 sm:inline-flex">
              <Badge tone="brand" size="sm">
                {meta.acronym}
              </Badge>
              <HelpTip text={meta.description} />
            </span>
          )}
        </div>
        <p className="truncate px-2 text-sm text-fg-muted tabular">{getBlockSummary(block)}</p>
      </div>
      <IconButton
        icon={collapsed ? ChevronDown : ChevronUp}
        label={collapsed ? 'Mostrar bloque' : 'Plegar bloque'}
        aria-expanded={!collapsed}
        onClick={onToggle}
      />
      <DropdownMenu items={menuItems} label="Opciones del bloque" />
    </div>
  )
}
