import { Tag } from 'lucide-react'
import { Chip, DropdownMenu, type MenuItem } from '@/components/ui'
import { useDisclosure, useIsMobile } from '@/hooks'
import type { Day } from '@/types'
import { DAY_LABEL_SUGGESTIONS } from '@/features/editor/config'
import { useDayFields } from '@/features/editor/hooks/useDayFields'
import { InlineInput } from '@/features/editor/components/common/InlineInput'

export interface DayHeaderProps {
  day: Day
  menuItems: MenuItem[]
}

/**
 * Day name and '⋯', then the optional focus label ('Pierna', 'Empuje') with one-tap suggestions:
 * on phones only while editing it, so they do not push the blocks down on every day.
 */
export function DayHeader({ day, menuItems }: DayHeaderProps) {
  const { rename, finishRename, setLabel } = useDayFields(day.id)
  const labelFocus = useDisclosure()
  const isMobile = useIsMobile()
  const showSuggestions = labelFocus.isOpen || (!day.label.trim() && !isMobile)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <InlineInput
          size="lg"
          aria-label="Nombre del día"
          value={day.name}
          placeholder="Día"
          onValueChange={rename}
          onBlur={finishRename}
          className="w-0 flex-1 md:w-full md:max-w-xs md:flex-none"
        />
        <div className="order-last flex w-full min-w-0 items-center gap-1 pl-2 md:order-none md:w-auto md:flex-1 md:pl-0">
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
        <div className="flex flex-wrap gap-2 px-2">
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
