import { BLOCK_TYPE_META } from '@/config/blockTypes'
import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface DisplayBlockTileProps {
  block: DisplayBlock
  theme: DisplayThemeClasses
  /** Density-specific size. */
  className: string
}

/** The block's letter (the 'A' of A1/A2, same colours as the row labels) or, on a warm-up/mobility block, its icon. */
export function DisplayBlockTile({ block, theme, className }: DisplayBlockTileProps) {
  const Icon = BLOCK_TYPE_META[block.type].icon
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center self-center py-[0.05em] leading-[1.15] font-extrabold',
        className,
        block.letter ? theme.blockLetter : theme.mutedBlockLetter,
      )}
    >
      {block.letter ?? <Icon size="0.75em" aria-hidden className="my-[0.2em]" />}
    </span>
  )
}
