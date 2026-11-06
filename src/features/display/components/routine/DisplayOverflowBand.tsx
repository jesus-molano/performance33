import { cn } from '@/lib/cn'
import { OVERFLOW_TEXTS } from '@/features/display/config/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface DisplayOverflowBandProps {
  /** Exercise lines the screen cannot show (0 when only a note or a header is cut). */
  hiddenRows: number
  theme: DisplayThemeClasses
}

/**
 * Band over the foot of a day that does not fit even at the smallest size. Its letter never goes below what reads
 * from a few metres, however small the routine's own size had to go.
 */
export function DisplayOverflowBand({ hiddenRows, theme }: DisplayOverflowBandProps) {
  return (
    <p
      className={cn('absolute inset-x-0 bottom-0 z-10 px-[0.8em] py-[0.35em] text-center font-bold text-[length:max(1.4em,20px)]', theme.blockBand)}
    >
      {hiddenRows > 0 ? OVERFLOW_TEXTS.rows(hiddenRows) : OVERFLOW_TEXTS.some}
    </p>
  )
}
