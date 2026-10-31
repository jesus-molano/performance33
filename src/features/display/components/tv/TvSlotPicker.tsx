import { cn } from '@/lib/cn'
import type { DisplayDay } from '@/lib/display'
import type { TvDragHandleBindings } from '@/features/display/hooks/useTvSortableSlot'
import type { ClientOption } from '@/features/display/utils/clientOptions'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { TV_PICKER_TEXTS } from '@/features/display/config/tv'
import { ClientCombobox } from './ClientCombobox'
import { OverlaySelect } from './OverlaySelect'
import { TvDragHandle } from './TvDragHandle'

interface TvSlotPickerProps {
  index: number
  clientId: string | null
  dayNumber: number
  clientOptions: ClientOption[]
  days: DisplayDay[]
  theme: DisplayThemeClasses
  /** null with a single column: no grip at all (the client box gets the space). */
  dragHandle: TvDragHandleBindings | null
  /** The grip fades with the rest of the controls (it keeps its place so the row does not jump). */
  dragHandleVisible: boolean
  onClientChange: (clientId: string | null) => void
  onDayChange: (day: number) => void
  onPickerOpenChange: (open: boolean) => void
}

/** Drag grip + client search + day picker for one TV column. */
export function TvSlotPicker({
  index,
  clientId,
  dayNumber,
  clientOptions,
  days,
  theme,
  dragHandle,
  dragHandleVisible,
  onClientChange,
  onDayChange,
  onPickerOpenChange,
}: TvSlotPickerProps) {
  const position = index + 1
  const dayOptions = days.map((d) => ({ value: String(d.number), label: d.title }))

  return (
    <div className={cn('flex w-full items-center gap-2 rounded-[1.75rem] p-1.5 shadow-pop', theme.overlay)}>
      {dragHandle && (
        <TvDragHandle handle={dragHandle} label={TV_PICKER_TEXTS.moveColumn(position)} hidden={!dragHandleVisible} />
      )}
      <ClientCombobox
        label={TV_PICKER_TEXTS.clientLabel(position)}
        options={clientOptions}
        selectedId={clientId}
        theme={theme}
        onChange={onClientChange}
        onOpenChange={onPickerOpenChange}
        className="flex-1"
      />
      {dayOptions.length > 1 && (
        <OverlaySelect
          label={TV_PICKER_TEXTS.dayLabel(position)}
          value={String(dayNumber)}
          options={dayOptions}
          onChange={(value) => onDayChange(Number(value))}
          className="flex-1"
        />
      )}
    </div>
  )
}
