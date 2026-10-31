import { Tag } from 'lucide-react'
import { Chip, DropdownMenu, type MenuItem } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import type { Day } from '@/types'
import { DAY_LABEL_SUGGESTIONS } from '@/features/editor/config'
import { useDayFields } from '@/features/editor/hooks/useDayFields'
import { InlineInput } from '@/features/editor/components/common/InlineInput'

export interface DayHeaderProps {
  day: Day
  menuItems: MenuItem[]
}

/** Day name + optional focus label ('Pierna', 'Empuje') with one-tap suggestions (also while editing it). */
export function DayHeader({ day, menuItems }: DayHeaderProps) {
  const { rename, setLabel } = useDayFields(day.id)
  const labelFocus = useDisclosure()
  const showSuggestions = !day.label.trim() || labelFocus.isOpen
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <InlineInput
          size="lg"
          aria-label="Nombre del día"
          value={day.name}
          placeholder="Día"
          onValueChange={rename}
          className="max-w-[60%] sm:max-w-xs"
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
            onValueChange={setLabel}
            onFocus={labelFocus.open}
            onBlur={labelFocus.close}
            className="font-medium"
          />
        </div>
        <DropdownMenu items={menuItems} label="Opciones del día" />
      </div>
      {showSuggestions && (
        <div className="flex gap-2 overflow-x-auto px-2 pb-1 scrollbar-none">
          {DAY_LABEL_SUGGESTIONS.map((suggestion) => (
            <Chip
              key={suggestion}
              active={day.label === suggestion}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setLabel(suggestion)}
            >
              {suggestion}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
