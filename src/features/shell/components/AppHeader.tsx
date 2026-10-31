import { paths } from '../../../lib/routes'
import { useBranding } from '../../../store'
import { CoachSwitcher } from './CoachSwitcher'
import { SaveIndicator } from './SaveIndicator'
import { UndoRedoButtons } from './UndoRedoButtons'

function MobileBrand() {
  const { iconUrl, gymName } = useBranding()
  return (
    <a href={paths.clients()} className="flex min-w-0 items-center gap-2 md:hidden" aria-label="Ir a clientes">
      {iconUrl && <img src={iconUrl} alt="" className="size-9 rounded-xl object-cover" />}
      <span className="truncate text-base font-semibold">{gymName}</span>
    </a>
  )
}

/** Sticky top bar: save status, undo/redo and the coach switcher. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-header items-center gap-1 border-b border-line bg-canvas/85 px-3 backdrop-blur-md sm:gap-2 md:px-8">
      <MobileBrand />
      <div className="flex-1" />
      <SaveIndicator />
      <UndoRedoButtons />
      <div className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
      <CoachSwitcher />
    </header>
  )
}
