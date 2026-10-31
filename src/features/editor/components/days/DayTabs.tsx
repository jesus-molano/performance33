import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Day } from '@/types'
import { SortableList } from '@/features/editor/components/dnd/SortableList'
import { DayTab } from './DayTab'

export interface DayTabsProps {
  days: Day[]
  selectedId: string | null
  onSelect: (dayId: string) => void
  onMove: (dayId: string, toIndex: number) => void
  onAdd: () => void
}

/** Sticky day switcher: tabs on desktop, horizontally scrollable pills on mobile. Drag to reorder. */
export function DayTabs({ days, selectedId, onSelect, onMove, onAdd }: DayTabsProps) {
  return (
    <div className="sticky top-header z-20 -mx-4 bg-canvas/90 px-4 py-2 backdrop-blur md:-mx-0 md:px-0">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-1 shadow-card">
        <div role="tablist" aria-label="Días de la rutina" className="flex min-w-0 flex-1 gap-1 overflow-x-auto scrollbar-none">
          <SortableList ids={days.map((d) => d.id)} onMove={onMove} orientation="horizontal">
            {days.map((day) => (
              <DayTab key={day.id} day={day} selected={day.id === selectedId} onSelect={() => onSelect(day.id)} />
            ))}
          </SortableList>
        </div>
        <Button variant="ghost" leftIcon={Plus} onClick={onAdd} className="shrink-0">
          <span className="hidden sm:inline">Añadir día</span>
          <span className="sm:hidden">Día</span>
        </Button>
      </div>
    </div>
  )
}
