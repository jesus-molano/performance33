import { Chip } from '@/components/ui'
import { BLOCK_TYPE_META, INTERVAL_PRESETS } from '@/config/blockTypes'
import type { Block, BlockParams } from '@/types'
import { ParamField } from './ParamField'

export interface BlockParamsEditorProps {
  block: Block
  onParamsChange: (patch: Partial<BlockParams>) => void
}

/** Only the params that apply to the block type (others are hidden, never disabled). */
export function BlockParamsEditor({ block, onParamsChange }: BlockParamsEditorProps) {
  const { params: keys } = BLOCK_TYPE_META[block.type]
  if (keys.length === 0) return null
  const p = block.params

  return (
    <div className="flex flex-col gap-3">
      {block.type === 'tabata' && (
        <div className="flex flex-wrap gap-2" aria-label="Intervalos rápidos">
          {INTERVAL_PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              active={p.workSec === preset.workSec && p.restSec === preset.restSec && p.rounds === preset.rounds}
              onClick={() => onParamsChange({ workSec: preset.workSec, restSec: preset.restSec, rounds: preset.rounds })}
            >
              {preset.label}
            </Chip>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {keys.map((key) => (
          <ParamField key={key} param={key} value={p[key]} onChange={(value) => onParamsChange({ [key]: value })} />
        ))}
      </div>
    </div>
  )
}
