import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge, DropdownMenu, HelpTip, IconButton, type MenuItem } from '@/components/ui'
import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { getAutoBlockTitle } from '@/lib/blocks'
import { cn } from '@/lib/cn'
import { getBlockSummary } from '@/lib/format'
import type { Block } from '@/types'
import type { DragHandleBindings } from '@/features/editor/hooks/useSortableItem'
import { InlineInput } from '@/features/editor/components/common/InlineInput'
import { DragHandle } from '@/features/editor/components/dnd/DragHandle'

export interface BlockHeaderBarProps {
  block: Block
  collapsed: boolean
  onToggle: () => void
  onTitleChange: (title: string) => void
  handle: DragHandleBindings
  menuItems: MenuItem[]
}

/** Grip · type icon (from sm, phones need the width for the title) · editable title (auto from type) · summary · collapse · '⋯'. */
export function BlockHeaderBar({ block, collapsed, onToggle, onTitleChange, handle, menuItems }: BlockHeaderBarProps) {
  const meta = BLOCK_TYPE_META[block.type]
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-1 p-2 md:gap-2 md:p-3">
      <DragHandle handle={handle} itemLabel="bloque" />
      <span
        className={cn(
          'hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex',
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
            onValueChange={onTitleChange}
          />
          {meta.acronym && (
            <span className="inline-flex shrink-0 items-center gap-1">
              <span className="hidden sm:inline-flex">
                <Badge tone="brand" size="sm">
                  {meta.acronym}
                </Badge>
              </span>
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
      <DropdownMenu items={menuItems} label={`Opciones del bloque ${block.title.trim() || getAutoBlockTitle(block)}`} />
    </div>
  )
}
