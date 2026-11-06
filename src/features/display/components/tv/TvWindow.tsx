import { TV_READABLE_SECTIONS } from '@/config/app'
import type { TvSlot } from '@/lib/routes'
import { TV_COLUMN_TEXTS } from '@/features/display/config/tv'
import { FadingOverlay } from '@/features/display/components/screen/FadingOverlay'
import { ScreenShell } from '@/features/display/components/screen/ScreenShell'
import { ScreenToolbar } from '@/features/display/components/screen/ScreenToolbar'
import { WindowHint } from '@/features/display/components/screen/WindowHint'
import { useSharedTextSize } from '@/features/display/hooks/useSharedTextSize'
import { useTvScreen } from '@/features/display/hooks/useTvScreen'
import { TvColumnControls } from './TvColumnControls'
import { TvColumns } from './TvColumns'
import { TvSlotView } from './TvSlotView'

interface TvWindowProps {
  /** Number of this named screen (Pantalla N). */
  screen: number
  /** List of an old ?slots= link, see TvPage. */
  legacySlots: TvSlot[] | null
}

/** One named TV window: its 1-6 sections, each an independent client routine. Empty until the screens are read. */
export function TvWindow({ screen: screenNumber, legacySlots }: TvWindowProps) {
  const screen = useTvScreen(screenNumber, legacySlots)
  const { chrome, theme, slots } = screen
  const textSize = useSharedTextSize(chrome.fontScale)

  return (
    <ScreenShell theme={theme} idle={!chrome.controlsVisible} onToggleFullscreen={chrome.toggleFullscreen}>
      {screen.status !== 'idle' && (
        <TvColumns ids={screen.slotIds} onMove={screen.moveColumn} gutterClassName={theme.sectionGutter}>
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
              unitCap={textSize.unitCap}
              onUnitChange={textSize.report}
              controlsVisible={chrome.controlsVisible}
              onClientChange={screen.setSlotClient}
              onDayChange={screen.setSlotDay}
            />
          ))}
        </TvColumns>
      )}
      <WindowHint visible={chrome.hintVisible} theme={theme} />
      <FadingOverlay visible={chrome.controlsVisible} position="inset-x-0 bottom-5 justify-center">
        <ScreenToolbar
          theme={theme}
          isFullscreen={chrome.isFullscreen}
          onToggleFullscreen={chrome.toggleFullscreen}
          onBigger={chrome.increase}
          onSmaller={chrome.decrease}
        >
          <span className="px-3 text-base font-bold whitespace-nowrap">{screen.title}</span>
          <TvColumnControls
            count={slots.length}
            canAdd={screen.canAddColumn}
            canRemove={screen.canRemoveColumn}
            onAdd={screen.addColumn}
            onRemove={screen.removeColumn}
          />
          {textSize.atLimit && <span className="px-2 text-sm font-medium whitespace-nowrap">{TV_COLUMN_TEXTS.sizeAtLimit}</span>}
          {slots.length > TV_READABLE_SECTIONS && (
            <span className="hidden px-2 text-sm font-medium whitespace-nowrap opacity-80 md:inline">{TV_COLUMN_TEXTS.manySectionsNote}</span>
          )}
        </ScreenToolbar>
      </FadingOverlay>
    </ScreenShell>
  )
}
