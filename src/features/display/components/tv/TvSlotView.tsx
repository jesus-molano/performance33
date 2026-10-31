import type { TvSlot } from '@/lib/routes'
import type { Branding, DisplayData, PublicClient } from '@/types'
import { useBlockFlash } from '@/features/display/hooks/useBlockFlash'
import { useDisplayRoutine } from '@/features/display/hooks/useDisplayRoutine'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { withSelectedClient } from '@/features/display/utils/tvSlots'
import { RoutineDisplay } from '@/features/display/components/RoutineDisplay'
import { FadingOverlay } from '@/features/display/components/screen/FadingOverlay'
import { TvSlotEmpty } from './TvSlotEmpty'
import { TvSlotPicker } from './TvSlotPicker'

interface TvSlotViewProps {
  index: number
  slot: TvSlot
  data: DisplayData | null
  clients: PublicClient[]
  branding: Branding
  theme: DisplayThemeClasses
  fontScale: number
  controlsVisible: boolean
  onClientChange: (index: number, clientId: string | null) => void
  onDayChange: (index: number, day: number) => void
}

/** One third of the Modo TV window: an independent client + day with its own fading picker. */
export function TvSlotView({
  index,
  slot,
  data,
  clients,
  branding,
  theme,
  fontScale,
  controlsVisible,
  onClientChange,
  onDayChange,
}: TvSlotViewProps) {
  const { routine, dayNumber, day } = useDisplayRoutine(data, slot.clientId, slot.day)
  const flashBlockIds = useBlockFlash(day)

  return (
    <section className="relative h-full min-h-0 min-w-0 overflow-hidden">
      {routine ? (
        <RoutineDisplay routine={routine} dayNumber={dayNumber} fontScale={fontScale} flashBlockIds={flashBlockIds} />
      ) : (
        <TvSlotEmpty data={data} clientId={slot.clientId} hasClients={clients.length > 0} branding={branding} theme={theme} />
      )}
      <FadingOverlay visible={controlsVisible || !routine} position="inset-x-0 top-3" fill>
        <TvSlotPicker
          index={index}
          clientId={slot.clientId}
          dayNumber={dayNumber}
          clients={withSelectedClient(clients, data, slot.clientId)}
          days={routine?.days ?? []}
          theme={theme}
          onClientChange={(clientId) => onClientChange(index, clientId)}
          onDayChange={(next) => onDayChange(index, next)}
        />
      </FadingOverlay>
    </section>
  )
}
