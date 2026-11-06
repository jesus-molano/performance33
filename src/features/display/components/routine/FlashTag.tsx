import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

/** 'Actualizado' tag at the end of a block's band when the block just changed. */
export function FlashTag({ theme }: { theme: DisplayThemeClasses }) {
  return (
    <span
      className={cn('animate-fade-in shrink-0 rounded-full px-[0.6em] py-[0.1em] text-[0.95em] font-semibold whitespace-nowrap', theme.badge)}
    >
      Actualizado
    </span>
  )
}
