import { cn } from '../../../../lib/cn'
import type { DisplayDay } from '../../../../lib/display'
import type { PublicClient } from '../../../../types'
import type { DisplayThemeClasses } from '../../utils/theme'
import { OverlaySelect } from './OverlaySelect'

const NO_CLIENT = ''

interface TvSlotPickerProps {
  index: number
  clientId: string | null
  dayNumber: number
  clients: PublicClient[]
  days: DisplayDay[]
  theme: DisplayThemeClasses
  onClientChange: (clientId: string | null) => void
  onDayChange: (day: number) => void
}

/** Client + day pickers for one third of the TV. */
export function TvSlotPicker({
  index,
  clientId,
  dayNumber,
  clients,
  days,
  theme,
  onClientChange,
  onDayChange,
}: TvSlotPickerProps) {
  const clientOptions = [
    { value: NO_CLIENT, label: 'Elige cliente…' },
    ...clients.map((c) => ({ value: c.id, label: c.firstName })),
  ]
  const dayOptions = days.map((d) => ({ value: String(d.number), label: d.title }))

  return (
    <div className={cn('flex w-full gap-2 rounded-[1.75rem] p-1.5 shadow-pop', theme.overlay)}>
      <OverlaySelect
        label={`Cliente de la columna ${index + 1}`}
        value={clientId ?? NO_CLIENT}
        options={clientOptions}
        onChange={(value) => onClientChange(value || null)}
        className="flex-1"
      />
      {dayOptions.length > 1 && (
        <OverlaySelect
          label={`Día de la columna ${index + 1}`}
          value={String(dayNumber)}
          options={dayOptions}
          onChange={(value) => onDayChange(Number(value))}
          className="flex-1"
        />
      )}
    </div>
  )
}
