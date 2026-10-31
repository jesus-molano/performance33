import type { TvSlot } from '@/lib/routes'
import { FadingOverlay } from '@/features/display/components/screen/FadingOverlay'
import { ScreenShell } from '@/features/display/components/screen/ScreenShell'
import { ScreenToolbar } from '@/features/display/components/screen/ScreenToolbar'
import { WindowHint } from '@/features/display/components/screen/WindowHint'
import { TvColumnControls } from '@/features/display/components/tv/TvColumnControls'
import { TvColumns } from '@/features/display/components/tv/TvColumns'
import { TvSlotView } from '@/features/display/components/tv/TvSlotView'
import { useTvScreen } from '@/features/display/hooks/useTvScreen'

export interface TvPageProps {
  /** TV_MIN_SLOTS..TV_MAX_SLOTS slots (3 by default), parsed from #/tv?slots=. */
  slots: TvSlot[]
}

/** 'Modo TV': 1-4 independent client routines side by side, as on the gym TVs. */
export function TvPage({ slots }: TvPageProps) {
  const screen = useTvScreen(slots)
  const { chrome, theme } = screen

  return (
    <ScreenShell theme={theme} idle={!chrome.controlsVisible} onToggleFullscreen={chrome.toggleFullscreen}>
      <TvColumns ids={screen.slotIds} theme={theme} onMove={screen.moveColumn}>
        {slots.map((slot, index) => (
          <TvSlotView
            key={screen.slotIds[index]}
            id={screen.slotIds[index]}
            index={index}
            slot={slot}
            data={screen.data}
            hasClients={screen.hasClients}
            sortable={slots.length > 1}
            layout={slots.length === 1 ? 'full' : 'column'}
            branding={screen.branding}
            theme={theme}
            fontScale={chrome.fontScale}
            controlsVisible={chrome.controlsVisible}
            onClientChange={screen.setSlotClient}
            onDayChange={screen.setSlotDay}
          />
        ))}
      </TvColumns>
      <WindowHint visible={chrome.hintVisible} theme={theme} />
      <FadingOverlay visible={chrome.controlsVisible} position="inset-x-0 bottom-5 justify-center">
        <ScreenToolbar
          theme={theme}
          isFullscreen={chrome.isFullscreen}
          onToggleFullscreen={chrome.toggleFullscreen}
          onBigger={chrome.increase}
          onSmaller={chrome.decrease}
        >
          <TvColumnControls
            count={slots.length}
            canAdd={screen.canAddColumn}
            canRemove={screen.canRemoveColumn}
            onAdd={screen.addColumn}
            onRemove={screen.removeColumn}
          />
        </ScreenToolbar>
      </FadingOverlay>
    </ScreenShell>
  )
}
