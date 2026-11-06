import { useCallback, useState } from 'react'
import { cn } from '@/lib/cn'
import type { TvSlot } from '@/lib/routes'
import type { Branding, DisplayData } from '@/types'
import { useTvSlot } from '@/features/display/hooks/useTvSlot'
import { useTvSortableSlot } from '@/features/display/hooks/useTvSortableSlot'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { RoutineDisplay, type RoutineDisplayLayout } from '@/features/display/components/RoutineDisplay'
import { FadingOverlay } from '@/features/display/components/screen/FadingOverlay'
import { TvSlotEmpty } from './TvSlotEmpty'
import { TvSlotPicker } from './TvSlotPicker'

interface TvSlotViewProps {
  /** Stable column id (sortable id), see useTvSlots. */
  id: string
  index: number
  slot: TvSlot
  data: DisplayData | null
  hasClients: boolean
  /** More than one column: reordering makes sense. */
  sortable: boolean
  /** 'full' when it is the only section, else 'column' (see RoutineDisplay). */
  layout: RoutineDisplayLayout
  /** Height of the whole TV: sizes are read against it, not against the section. */
  referenceHeight: number
  branding: Branding
  theme: DisplayThemeClasses
  fontScale: number
  /** Text size shared by the columns of this screen. */
  unitCap: number | undefined
  onUnitChange: (columnId: string, unit: number | null) => void
  controlsVisible: boolean
  onClientChange: (index: number, clientId: string | null) => void
  onDayChange: (index: number, day: number) => void
}

/** One Modo TV column: an independent client + day with its own fading picker and drag grip. */
export function TvSlotView({
  id,
  index,
  slot,
  data,
  hasClients,
  sortable,
  layout,
  referenceHeight,
  branding,
  theme,
  fontScale,
  unitCap,
  onUnitChange,
  controlsVisible,
  onClientChange,
  onDayChange,
}: TvSlotViewProps) {
  const { clientId, routine, dayNumber, flashBlockIds, clientOptions } = useTvSlot(data, slot)
  const { setNodeRef, style, isDragging, handle } = useTvSortableSlot(id)
  // An open client list keeps the picker on screen even when the idle timer hides the controls.
  const [pickerOpen, setPickerOpen] = useState(false)
  const active = controlsVisible || isDragging || pickerOpen
  const reportUnit = useCallback((unit: number | null) => onUnitChange(id, unit), [id, onUnitChange])

  return (
    <section ref={setNodeRef} style={style} className={cn('relative h-full min-h-0 min-w-0 overflow-hidden', theme.root)}>
      {routine ? (
        <RoutineDisplay
          routine={routine}
          dayNumber={dayNumber}
          layout={layout}
          fontScale={fontScale}
          flashBlockIds={flashBlockIds}
          unitCap={unitCap}
          onUnitChange={reportUnit}
          referenceHeight={referenceHeight}
        />
      ) : (
        <TvSlotEmpty data={data} clientId={clientId} hasClients={hasClients} branding={branding} theme={theme} />
      )}
      <FadingOverlay visible={active || !routine} position="inset-x-0 top-3" fill>
        <TvSlotPicker
          index={index}
          clientId={clientId}
          dayNumber={dayNumber}
          clientOptions={clientOptions}
          days={routine?.days ?? []}
          theme={theme}
          dragHandle={sortable ? handle : null}
          dragHandleVisible={active}
          onClientChange={(clientId) => onClientChange(index, clientId)}
          onDayChange={(next) => onDayChange(index, next)}
          onPickerOpenChange={setPickerOpen}
        />
      </FadingOverlay>
    </section>
  )
}
