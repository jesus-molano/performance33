import { RoutineDisplay } from '@/features/display/components/RoutineDisplay'
import { useSingleDisplay } from '@/features/display/hooks/useSingleDisplay'
import type { RoutineDaysParams } from '@/features/display/hooks/useRoutineDays'
import { DaySwitcher } from './DaySwitcher'
import { DisplayFallback } from './DisplayFallback'
import { FadingOverlay } from './FadingOverlay'
import { ScreenShell } from './ScreenShell'
import { ScreenToolbar } from './ScreenToolbar'
import { WindowHint } from './WindowHint'

/** Single-client TV window: the whole day fits the window without scrolling. Reads ONLY sanitised live data. */
export function DisplayWindow(props: RoutineDaysParams) {
  const screen = useSingleDisplay(props)
  const { chrome, routine, theme } = screen

  return (
    <ScreenShell theme={theme} idle={!chrome.controlsVisible} onToggleFullscreen={chrome.toggleFullscreen}>
      {routine ? (
        <RoutineDisplay
          routine={routine}
          dayNumber={screen.dayNumber}
          layout="full"
          fontScale={chrome.fontScale}
          flashBlockIds={screen.flashBlockIds}
        />
      ) : (
        <DisplayFallback hasData={screen.data != null} name={screen.clientFirstName} branding={screen.branding} theme={theme} />
      )}
      <WindowHint visible={chrome.hintVisible} theme={theme} extra={screen.dayCount > 1 ? '← → cambia de día' : undefined} />
      <FadingOverlay visible={chrome.controlsVisible} position="inset-x-0 bottom-5 justify-center">
        <ScreenToolbar
          theme={theme}
          isFullscreen={chrome.isFullscreen}
          onToggleFullscreen={chrome.toggleFullscreen}
          onBigger={chrome.increase}
          onSmaller={chrome.decrease}
        >
          {routine && screen.dayCount > 0 && (
            <DaySwitcher
              dayNumber={screen.dayNumber}
              dayCount={screen.dayCount}
              dayTitle={screen.dayTitle}
              onPrev={screen.prevDay}
              onNext={screen.nextDay}
            />
          )}
        </ScreenToolbar>
      </FadingOverlay>
    </ScreenShell>
  )
}
