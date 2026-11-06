import { Laptop, Settings } from 'lucide-react'
import { Modal } from '@/components/ui'
import { paths } from '@/lib/routes'
import { REMOTE_COPY } from '@/features/screens'
import { TV_LAUNCHER } from '@/features/shell/config'
import { useScreensRemoteSheet } from '@/features/shell/hooks/useScreensRemoteSheet'
import { RemoteScreenCard } from './RemoteScreenCard'
import { RemoteSectionSheet } from './RemoteSectionSheet'

export interface ScreensRemoteSheetProps {
  open: boolean
  onClose: () => void
}

function RemoteSheetBody({ onClose }: { onClose: () => void }) {
  const sheet = useScreensRemoteSheet()
  const { status, screens, setSections } = sheet.remote
  const empty = status === 'idle' ? REMOTE_COPY.loading : screens.length ? null : REMOTE_COPY.noScreens
  const description = REMOTE_COPY.description(screens.some((screen) => screen.online))

  return (
    <Modal open onClose={onClose} size="lg" title={REMOTE_COPY.title} description={description} focusFirstField={false} nativeUndo={false} fill>
      <div className="flex flex-col gap-3">
        {empty ? (
          <p role="status" className="py-6 text-center text-md text-fg-muted">
            {empty}
          </p>
        ) : (
          screens.map((screen) => (
            <RemoteScreenCard key={screen.id} screen={screen} onPick={sheet.pick} onSections={(sections) => setSections(screen.id, sections)} />
          ))
        )}
        <p className="flex items-start gap-2 text-sm text-fg-subtle">
          <Laptop size={16} aria-hidden className="mt-0.5 shrink-0" />
          {REMOTE_COPY.laptopOnly}
        </p>
        <a href={paths.settings('pantallas')} onClick={onClose} className="inline-flex min-h-11 items-center gap-2 self-start text-md font-medium text-brand-strong">
          <Settings size={18} aria-hidden />
          {TV_LAUNCHER.settings}
        </a>
      </div>
      <RemoteSectionSheet sheet={sheet} />
    </Modal>
  )
}

/** 'Pantallas' on a phone: a remote control of what each gym screen shows (the windows open from the laptop). */
export function ScreensRemoteSheet({ open, onClose }: ScreensRemoteSheetProps) {
  return open ? <RemoteSheetBody onClose={onClose} /> : null
}
