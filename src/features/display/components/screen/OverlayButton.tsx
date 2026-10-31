import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface OverlayButtonProps {
  label: string
  onClick: () => void
  icon?: LucideIcon
  children?: ReactNode
  disabled?: boolean
  /** Pill that fits a short text ('+ columna') instead of a 44 px circle. */
  wide?: boolean
}

/** 44 px round control for the TV overlays (works with a remote / air mouse). */
export function OverlayButton({ label, onClick, icon: Icon, children, disabled, wide = false }: OverlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-11 shrink-0 items-center justify-center rounded-full font-semibold transition-colors hover:bg-current/15 disabled:opacity-30 disabled:hover:bg-transparent',
        wide ? 'px-3 text-base whitespace-nowrap' : 'w-11 text-lg',
      )}
    >
      {Icon ? <Icon size={22} aria-hidden /> : children}
    </button>
  )
}
