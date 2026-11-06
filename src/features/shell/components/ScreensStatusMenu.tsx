import { ScreensStatusChip, useAutoTvScreens, useScreensSummary } from '@/features/screens'
import { usePopover } from '@/features/shell/hooks/usePopover'
import { useTvDisconnectAlert } from '@/features/shell/hooks/useTvDisconnectAlert'
import { TvScreensList } from './TvScreensList'

/** The screens status in the top bar; a click lists the TVs, each one opening or coming to the front. It also says when the TV of an open screen goes away, and gives each TV seen its screen (useAutoTvScreens). */
export function ScreensStatusMenu() {
  const summary = useScreensSummary()
  const { isOpen, toggle, close, rootRef } = usePopover()
  useTvDisconnectAlert()
  useAutoTvScreens()
  if (!summary) return null

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <ScreensStatusChip summary={summary} expanded={isOpen} onClick={toggle} />
      {isOpen && (
        <div className="absolute top-full right-0 z-40 mt-1 max-h-[calc(100dvh-8rem)] w-80 origin-top-right animate-pop-in overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
          <TvScreensList onDone={close} />
        </div>
      )}
    </div>
  )
}
