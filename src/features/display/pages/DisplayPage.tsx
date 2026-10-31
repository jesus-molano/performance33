import { FadingOverlay } from '@/features/display/components/screen/FadingOverlay'
import { ScreenShell } from '@/features/display/components/screen/ScreenShell'
import { ScreenToolbar } from '@/features/display/components/screen/ScreenToolbar'
import { DaySwitcher } from '@/features/display/components/screen/DaySwitcher'
import { WindowHint } from '@/features/display/components/screen/WindowHint'
import { DisplayFallback } from '@/features/display/components/screen/DisplayFallback'
import { RoutineDisplay } from '@/features/display/components/RoutineDisplay'
import { useSingleDisplay } from '@/features/display/hooks/useSingleDisplay'

export interface DisplayPageProps {
  clientId: string
  /** 1-based day from ?dia= (null → first day). */
  day: number | null
  /** From ?programa= (null → client's current program). */
  programId: string | null
}

/** Single-client TV window (#/pantalla/:clientId). Reads ONLY sanitised live data. */
export function DisplayPage(props: DisplayPageProps) {
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
