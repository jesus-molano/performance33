import { Tag } from 'lucide-react'
import { Chip, DropdownMenu, type MenuItem } from '../../../../components/ui'
import { useAppActions } from '../../../../store'
import type { Day } from '../../../../types'
import { DAY_LABEL_SUGGESTIONS } from '../../config'
import { InlineInput } from '../common/InlineInput'

export interface DayHeaderProps {
  day: Day
  menuItems: MenuItem[]
}

/** Day name + optional focus label ('Pierna', 'Empuje') with one-tap suggestions. */
export function DayHeader({ day, menuItems }: DayHeaderProps) {
  const { updateDay } = useAppActions()
  const label = day.label.trim()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <InlineInput
          size="lg"
          aria-label="Nombre del día"
          value={day.name}
          placeholder="Día"
          onValueChange={(name) => updateDay(day.id, { name })}
          className="max-w-40"
        />
        <span className="text-fg-subtle" aria-hidden>
          ·
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Tag size={16} aria-hidden className="shrink-0 text-fg-subtle" />
          <InlineInput
            aria-label="Enfoque del día (opcional)"
            value={day.label}
            placeholder="Enfoque (opcional)"
            onValueChange={(value) => updateDay(day.id, { label: value })}
            className="font-medium"
          />
        </div>
        <DropdownMenu items={menuItems} label="Opciones del día" />
      </div>
      {!label && (
        <div className="flex gap-2 overflow-x-auto px-2 pb-1 scrollbar-none">
          {DAY_LABEL_SUGGESTIONS.map((suggestion) => (
            <Chip key={suggestion} onClick={() => updateDay(day.id, { label: suggestion })}>
              {suggestion}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
