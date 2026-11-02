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

/** Blocks flow in 1 or 2 balanced columns (column count set by auto-fit). */
export function DisplayBlockList({ blocks, density, theme, flashBlockIds }: DisplayBlockListProps) {
  return (
    <div className={cn('[column-count:var(--display-columns,1)]', DENSITY_STYLES[density].columnGap)}>
      {blocks.map((block) => (
        <DisplayBlockCard
          key={block.id}
          block={block}
          density={density}
          theme={theme}
          flashing={flashBlockIds.has(block.id)}
        />
      ))}
    </div>
  )
}
