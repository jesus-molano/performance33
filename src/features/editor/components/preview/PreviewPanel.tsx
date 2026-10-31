import { Eye } from 'lucide-react'
import { Modal } from '../../../../components/ui'
import { PreviewContent, type PreviewContentProps } from './PreviewContent'

/** Side panel on wide screens: sticks while the coach scrolls through the blocks. */
export function PreviewAside(props: PreviewContentProps) {
  return (
    <aside aria-label="Vista pantalla" className="hidden self-stretch xl:block">
      <div className="sticky top-[calc(var(--spacing-header)+1rem)] flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-fg-muted uppercase">
          <Eye size={16} aria-hidden className="text-brand-strong" />
          Lo que verá el cliente
        </h2>
        <PreviewContent {...props} />
      </div>
    </aside>
  )
}

export interface PreviewSheetProps extends PreviewContentProps {
  open: boolean
  onClose: () => void
}

/** Same preview in a bottom sheet on tablets and phones. */
export function PreviewSheet({ open, onClose, ...props }: PreviewSheetProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Vista pantalla" description="Así lo verá el cliente en la tele.">
      <div className="mx-auto max-w-xs pb-2">
        <PreviewContent {...props} />
      </div>
    </Modal>
  )
}
