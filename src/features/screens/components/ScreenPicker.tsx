import { Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { ScreensStatus, SectionRef } from '@/features/screens/types'
import type { PickerScreen } from '@/features/screens/utils/picker'
import { ScreenPickerCard } from './ScreenPickerCard'

export interface ScreenPickerProps {
  open: boolean
  onClose: () => void
  clientName: string
  dayLabel: string
  status: ScreensStatus
  screens: PickerScreen[]
  canOpenScreens: boolean
  /** 'Ctrl+clic en «Pantalla» manda directo a…', or null. */
  hint: string | null
  onPick: (ref: SectionRef) => void
  onOpenScreen: (screen: number) => void
}

/** 'Mandar a pantalla': one card per TV with its sections; a tap on a section sends there. Bottom sheet on phones. */
export function ScreenPicker({ open, onClose, clientName, dayLabel, status, screens, canOpenScreens, hint, onPick, onOpenScreen }: ScreenPickerProps) {
  const empty = status === 'idle' ? SEND_COPY.loading : screens.length ? null : SEND_COPY.noScreens
  return (
    <Modal open={open} onClose={onClose} size="lg" title={SEND_COPY.title(clientName)} description={SEND_COPY.description(dayLabel)}>
      {empty ? (
        <p role="status" className="py-6 text-center text-md text-fg-muted">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className={cn('grid gap-3', screens.length > 1 && 'md:grid-cols-2')}>
            {screens.map((screen) => (
              <ScreenPickerCard
                key={screen.id}
                screen={screen}
                clientName={clientName}
                canOpen={canOpenScreens}
                onPick={onPick}
                onOpen={() => onOpenScreen(screen.id)}
              />
            ))}
          </div>
          {hint && <p className="text-sm text-fg-muted">{hint}</p>}
        </div>
      )}
    </Modal>
  )
}
