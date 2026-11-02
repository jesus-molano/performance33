import { cn } from '@/lib/cn'
import type { DisplayBlock } from '@/lib/display'
import type { DisplayDensity } from '@/features/display/utils/autoFit'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { DENSITY_STYLES } from './densityStyles'
import { DisplayBlockCard } from './DisplayBlockCard'

interface DisplayBlockListProps {
  blocks: DisplayBlock[]
  density: DisplayDensity
  theme: DisplayThemeClasses
  flashBlockIds: ReadonlySet<string>
}

/**
 * Blocks read top to bottom. When auto-fit splits the screen they flow down the left and then down the right, balanced,
 * with a divider between both parts and no block ever cut (break-inside-avoid on the card).
 */
export function DisplayBlockList({ blocks, density, theme, flashBlockIds }: DisplayBlockListProps) {
  return (
    <div className={cn('[column-count:var(--display-columns,1)]', DENSITY_STYLES[density].split, theme.splitDivider)}>
      {blocks.map((block, index) => (
        <DisplayBlockCard
          key={block.id}
          block={block}
          number={index + 1}
          density={density}
          theme={theme}
          flashing={flashBlockIds.has(block.id)}
        />
      ))}
    </div>
  )
}
