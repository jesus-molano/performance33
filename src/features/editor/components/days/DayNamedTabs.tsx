import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { DAY_TOUCH_ACTIVATION } from '@/features/editor/config'
import { SortableList } from '@/features/editor/components/dnd/SortableList'
import { DayTab } from './DayTab'
import type { DayTabsProps } from './DayTabs'

/** Tablet and desktop: the tabs share the row and shorten their names. A full routine explains itself when adding. */
export function DayNamedTabs({ days, selectedId, onSelect, onMove, onAdd }: DayTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-line bg-surface p-1 shadow-card">
      <div role="tablist" aria-label="Días de la rutina" className="flex min-w-0 flex-1 gap-1">
        <SortableList ids={days.map((d) => d.id)} onMove={onMove} orientation="horizontal" touchActivation={DAY_TOUCH_ACTIVATION}>
          {days.map((day) => (
            <DayTab key={day.id} day={day} selected={day.id === selectedId} onSelect={() => onSelect(day.id)} />
          ))}
        </SortableList>
      </div>
      <Button variant="ghost" leftIcon={Plus} onClick={onAdd} aria-label="Añadir día" title="Añadir día" className="shrink-0 px-3">
        <span className="hidden whitespace-nowrap lg:inline">Añadir día</span>
      </Button>
    </div>
  )
}
