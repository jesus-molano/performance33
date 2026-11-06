import { Plus, Settings } from 'lucide-react'
import { ScreenDetectionNotice } from '@/components/ScreenDetectionNotice'
import { paths } from '@/lib/routes'
import { TvWindowsActions } from '@/features/screens'
import { TV_LAUNCHER } from '@/features/shell/config'
import { useTvLauncher } from '@/features/shell/hooks/useTvLauncher'
import { TvScreenRow } from './TvScreenRow'

const FOOT_ITEM = 'flex h-11 items-center gap-3 rounded-lg px-3 text-left text-md font-medium text-fg hover:bg-fg/5 disabled:opacity-40'

/**
 * Content of the 'Pantallas' menu: each screen opens or goes back to its place, with its sections at hand; 'Traer al
 * portátil' / 'Cerrar todas' while some are open; 'Añadir pantalla' (adds and opens the next) only when the screens
 * cannot be seen; 'Ajustes de pantallas' at the foot.
 */
export function TvScreensList({ onDone }: { onDone: () => void }) {
  const launcher = useTvLauncher()
  const run = (action: () => void) => () => {
    onDone()
    action()
  }

  return (
    <div className="flex flex-col">
      <ScreenDetectionNotice state={launcher.detection.state} tvCount={launcher.tvCount} onRequest={launcher.detection.request} className="m-1.5" />
      <p className="px-3 pt-2 pb-1 text-sm text-fg-muted">{TV_LAUNCHER.hint}</p>
      <ul>
        {launcher.entries.map((entry) => (
          <TvScreenRow
            key={entry.screen}
            entry={entry}
            canRemove={launcher.canRemove(entry.screen)}
            onOpen={run(() => launcher.open(entry.screen))}
            onRemove={run(() => launcher.remove(entry.screen))}
            onSections={(sections) => launcher.setSections(entry.screen, sections)}
          />
        ))}
      </ul>
      <TvWindowsActions onDone={onDone} className="px-3 py-2" />
      <div className="my-1 h-px bg-line" aria-hidden />
      {launcher.showAdd && (
        <button type="button" onClick={run(launcher.add)} disabled={!launcher.canAdd} className={FOOT_ITEM}>
          <Plus size={18} aria-hidden className="text-fg-muted" />
          {TV_LAUNCHER.add}
        </button>
      )}
      <a href={paths.settings('pantallas')} onClick={onDone} className={FOOT_ITEM}>
        <Settings size={18} aria-hidden className="text-fg-muted" />
        {TV_LAUNCHER.settings}
      </a>
    </div>
  )
}
