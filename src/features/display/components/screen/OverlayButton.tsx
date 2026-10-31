import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface OverlayButtonProps {
  label: string
  onClick: () => void
  icon?: LucideIcon
  children?: ReactNode
  disabled?: boolean
}

/** 44 px round control for the TV overlays (works with a remote / air mouse). */
export function OverlayButton({ label, onClick, icon: Icon, children, disabled }: OverlayButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-semibold transition-colors hover:bg-current/15 disabled:opacity-30"
    >
      {Icon ? <Icon size={22} aria-hidden /> : children}
    </button>
  )
}
