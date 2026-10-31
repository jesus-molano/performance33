import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useToastStore, type Toast } from '../../store/toastStore'

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.durationMs)
    return () => clearTimeout(timer)
  }, [toast.id, toast.durationMs, onDismiss])

  const Icon = toast.tone === 'error' ? CircleAlert : toast.tone === 'success' ? CircleCheck : null
  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-md animate-slide-up items-center gap-3 rounded-2xl bg-ink py-2.5 pr-2 pl-4 text-[15px] text-white shadow-pop"
    >
      {Icon && <Icon size={18} aria-hidden className={cn(toast.tone === 'error' ? 'text-red-400' : 'text-emerald-400')} />}
      <span className="min-w-0 flex-1">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          onClick={() => {
            toast.onAction?.()
            onDismiss(toast.id)
          }}
          className="h-9 rounded-lg px-3 font-semibold text-brand hover:bg-white/10"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar aviso"
        className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-white/10 hover:text-white"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}

/** Toast stack (bottom centre). Mounted once in App; show toasts with useToast(). */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  )
}
