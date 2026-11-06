import { paths } from '@/lib/routes'
import { useBranding } from '@/store'
import { AccountMenu } from './AccountMenu'
import { SaveIndicator } from './SaveIndicator'
import { ScreensStatusMenu } from './ScreensStatusMenu'
import { UndoRedoButtons } from './UndoRedoButtons'

function MobileBrand() {
  const { iconUrl, gymName } = useBranding()
  return (
    <a href={paths.clients()} className="flex h-11 min-w-11 items-center md:hidden" aria-label="Ir a usuarios">
      {iconUrl ? <img src={iconUrl} alt="" className="size-9 rounded-xl object-cover" /> : <span className="truncate text-base font-semibold">{gymName}</span>}
    </a>
  )
}

/** Sticky top bar: which TVs are open, save status, undo/redo and the signed-in coach. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-header items-center gap-1 border-b border-line bg-canvas/85 px-3 backdrop-blur-md sm:gap-2 md:px-8">
      <MobileBrand />
      <div className="flex-1" />
      <ScreensStatusMenu />
      <SaveIndicator />
      <UndoRedoButtons />
      <div className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
      <AccountMenu />
    </header>
  )
}
