import { Plus } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { CAPACITY_TEXTS } from '@/config/capacity'
import { DAY_TOUCH_ACTIVATION } from '@/features/editor/config'
import { SortableList } from '@/features/editor/components/dnd/SortableList'
import { DayNumberTab } from './DayNumberTab'
import type { DayTabsProps } from './DayTabs'

/** Phones: equal numbered buttons across the row (6 fit at 320 px), + while there is room. Long press and drag reorders. */
export function DayNumberTabs({ days, selectedId, canAdd, onSelect, onMove, onAdd }: DayTabsProps) {
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(2.75rem,1fr))] gap-0.5 rounded-2xl border border-line bg-surface p-1 shadow-card">
        <div role="tablist" aria-label="Días de la rutina" className="contents">
          <SortableList ids={days.map((d) => d.id)} onMove={onMove} orientation="horizontal" touchActivation={DAY_TOUCH_ACTIVATION}>
            {days.map((day, index) => (
              <DayNumberTab key={day.id} day={day} number={index + 1} selected={day.id === selectedId} onSelect={() => onSelect(day.id)} />
            ))}
          </SortableList>
        </div>
        {canAdd && <IconButton icon={Plus} label="Añadir día" onClick={onAdd} className="w-full" />}
      </div>
      {!canAdd && <p className="mt-1 text-center text-xs text-fg-muted">{CAPACITY_TEXTS.daysFull}</p>}
    </>
  )
}
