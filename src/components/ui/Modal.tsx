import { X } from 'lucide-react'
import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalBehavior } from '../../hooks/useModalBehavior'
import { NATIVE_UNDO_ATTRIBUTE } from '../../hooks/useUndoShortcuts'
import { cn } from '../../lib/cn'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<ModalSize, string> = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  /** Buttons row; rendered sticky at the bottom. */
  footer?: ReactNode
  size?: ModalSize
  children?: ReactNode
}

/**
 * Centered dialog on desktop, bottom sheet on mobile (< 768 px). Escape / backdrop / X close it.
 * Its content keeps native Ctrl+Z (local-state forms), see NATIVE_UNDO_ATTRIBUTE.
 */
export function Modal({ open, onClose, title, description, footer, size = 'md', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModalBehavior(open, onClose, panelRef)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...{ [NATIVE_UNDO_ATTRIBUTE]: '' }}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col bg-surface shadow-pop',
          'animate-slide-up rounded-t-3xl md:animate-pop-in md:rounded-2xl',
          SIZES[size],
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line-strong md:hidden" aria-hidden />
        <header className="flex items-start gap-3 px-5 pt-4 pb-3 md:px-6 md:pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-fg">
              {title}
            </h2>
            {description && <p className="mt-1 text-[15px] text-fg-muted">{description}</p>}
          </div>
          <button
            type="button"
            data-modal-close
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-xl text-fg-muted hover:bg-fg/5 hover:text-fg"
          >
            <X size={20} aria-hidden />
          </button>
        </header>
        {children && <div className="flex-1 overflow-y-auto px-5 pb-4 md:px-6">{children}</div>}
        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end md:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
