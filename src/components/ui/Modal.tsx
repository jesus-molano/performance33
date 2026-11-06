import { X } from 'lucide-react'
import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalBehavior } from '@/hooks/useModalBehavior'
import { NATIVE_UNDO_ATTRIBUTE } from '@/hooks/useUndoShortcuts'
import { cn } from '@/lib/cn'

const NO_DISMISS = (): void => undefined

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
  /** Ctrl+Z stays native inside (default, for local-state forms). Pass false when the fields are bound to the store. */
  nativeUndo?: boolean
  /** Focus the first field on open (default). False focuses the panel, so a phone doesn't raise its keyboard. */
  focusFirstField?: boolean
  /** Only its own buttons close it: for what would be lost for good if it closed by accident. */
  persistent?: boolean
  /** Keep its full height whatever the content: what is tapped doesn't move when the content grows or shrinks. */
  fill?: boolean
}

/**
 * Centered dialog on desktop, bottom sheet on mobile (< 768 px). Escape / backdrop / X close it.
 * Its content keeps native Ctrl+Z unless nativeUndo is false, see NATIVE_UNDO_ATTRIBUTE.
 */
export function Modal({ open, onClose, title, description, footer, size = 'md', children, nativeUndo = true, focusFirstField = true, persistent = false, fill = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const dismiss = persistent ? NO_DISMISS : onClose
  useModalBehavior(open, dismiss, panelRef, focusFirstField)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]" onClick={dismiss} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        {...(nativeUndo ? { [NATIVE_UNDO_ATTRIBUTE]: '' } : {})}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col bg-surface shadow-pop outline-none',
          'animate-slide-up rounded-t-3xl md:animate-pop-in md:rounded-2xl',
          SIZES[size],
          fill && 'h-[92dvh] md:h-full',
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line-strong md:hidden" aria-hidden />
        <header className="flex items-start gap-3 px-5 pt-4 pb-3 md:px-6 md:pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-fg">
              {title}
            </h2>
            {description && <p className="mt-1 text-md text-fg-muted">{description}</p>}
          </div>
          {!persistent && (
            <button
              type="button"
              data-modal-close
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-xl text-fg-muted hover:bg-fg/5 hover:text-fg"
            >
              <X size={20} aria-hidden />
            </button>
          )}
        </header>
        {children && <div className="flex-1 overflow-y-auto px-5 pb-4 md:px-6">{children}</div>}
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1 md:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
