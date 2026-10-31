import type { TvSlot } from '../../../lib/routes'
import { cn } from '../../../lib/cn'
import { FadingOverlay } from '../components/screen/FadingOverlay'
import { ScreenShell } from '../components/screen/ScreenShell'
import { ScreenToolbar } from '../components/screen/ScreenToolbar'
import { WindowHint } from '../components/screen/WindowHint'
import { TvSlotView } from '../components/tv/TvSlotView'
import { useTvScreen } from '../hooks/useTvScreen'

export interface TvPageProps {
  /** Always TV_SLOT_COUNT (3) slots, parsed from #/tv?slots=. */
  slots: TvSlot[]
}

/** 'Modo TV (3 columnas)': three independent client routines side by side, as on the gym TVs. */
export function TvPage({ slots }: TvPageProps) {
  const screen = useTvScreen(slots)
  const { chrome, theme } = screen

  return (
    <ScreenShell theme={theme} idle={!chrome.controlsVisible} onToggleFullscreen={chrome.toggleFullscreen}>
      <div className={cn('grid h-full grid-cols-3 grid-rows-[minmax(0,1fr)] divide-x-2', theme.columnDivider)}>
        {slots.map((slot, index) => (
          <TvSlotView
            key={index}
            index={index}
            slot={slot}
            data={screen.data}
            clients={screen.clients}
            branding={screen.branding}
            theme={theme}
            fontScale={chrome.fontScale}
            controlsVisible={chrome.controlsVisible}
            onClientChange={screen.setSlotClient}
            onDayChange={screen.setSlotDay}
          />
        ))}
      </div>
      <WindowHint visible={chrome.hintVisible} theme={theme} />
      <FadingOverlay visible={chrome.controlsVisible} position="inset-x-0 bottom-5 justify-center">
        <ScreenToolbar
          theme={theme}
          isFullscreen={chrome.isFullscreen}
          onToggleFullscreen={chrome.toggleFullscreen}
          onBigger={chrome.increase}
          onSmaller={chrome.decrease}
        />
      </FadingOverlay>
    </ScreenShell>
  )
}
