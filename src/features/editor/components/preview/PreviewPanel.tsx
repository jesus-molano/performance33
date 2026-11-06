import { Eye } from 'lucide-react'
import { Modal } from '@/components/ui'
import { PreviewContent, type PreviewContentProps } from './PreviewContent'

/** Frame width that keeps the 16:27 TV frame + caption + button within the viewport while sticky. */
const ASIDE_FRAME_WIDTH = 'w-[min(100%,calc((100dvh-var(--spacing-header)-12rem)*16/27))]'

/** Side panel on wide screens: sticks while the coach scrolls through the blocks. */
export function PreviewAside(props: Omit<PreviewContentProps, 'frameClassName'>) {
  return (
    <aside aria-label="Vista previa" className="hidden self-stretch xl:block">
      <div className="sticky top-[calc(var(--spacing-header)+1rem)] flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-fg-muted uppercase">
          <Eye size={16} aria-hidden className="text-brand-strong" />
          Lo que verá el usuario
        </h2>
        <PreviewContent {...props} frameClassName={ASIDE_FRAME_WIDTH} />
      </div>
    </aside>
  )
}

export interface PreviewSheetProps extends Omit<PreviewContentProps, 'frameClassName'> {
  open: boolean
  onClose: () => void
}

/** Same preview in a bottom sheet on tablets and phones. */
export function PreviewSheet({ open, onClose, ...props }: PreviewSheetProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Vista previa" description="Así lo verá el usuario en la pantalla.">
      <div className="mx-auto max-w-xs pb-2">
        <PreviewContent {...props} />
      </div>
    </Modal>
  )
}
