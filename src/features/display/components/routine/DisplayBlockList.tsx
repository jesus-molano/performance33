import type { DisplayBlock } from '../../../../lib/display'
import type { DisplayThemeClasses } from '../../utils/theme'
import { DisplayBlockCard } from './DisplayBlockCard'

interface DisplayBlockListProps {
  blocks: DisplayBlock[]
  week: number
  theme: DisplayThemeClasses
  flashBlockIds: ReadonlySet<string>
}

/** Blocks flow in 1 or 2 balanced columns (column count set by auto-fit). */
export function DisplayBlockList({ blocks, week, theme, flashBlockIds }: DisplayBlockListProps) {
  return (
    <div className="[column-count:var(--display-columns,1)] [column-gap:1.4em]">
      {blocks.map((block) => (
        <DisplayBlockCard
          key={block.id}
          block={block}
          week={week}
          theme={theme}
          flashing={flashBlockIds.has(block.id)}
        />
      ))}
    </div>
  )
}
