import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface FlashTagProps {
  theme: DisplayThemeClasses
  /** Placement from DENSITY_STYLES (floating above the card, or inline at the end of a compact header). */
  className: string
}

/** 'Actualizado' tag on a block that just changed. */
export function FlashTag({ theme, className }: FlashTagProps) {
  return (
    <span
      className={cn('animate-fade-in rounded-full px-[0.6em] py-[0.1em] text-[0.95em] font-semibold whitespace-nowrap', theme.badge, className)}
    >
      Actualizado
    </span>
  )
}
