import { Chip } from '../../../../components/ui'
import { BLOCK_TYPE_META, INTERVAL_PRESETS } from '../../../../config/blockTypes'
import { useAppActions } from '../../../../store'
import type { Block } from '../../../../types'
import { ParamField } from './ParamField'

export interface BlockParamsEditorProps {
  block: Block
}

/** Only the params that apply to the block type (others are hidden, never disabled). */
export function BlockParamsEditor({ block }: BlockParamsEditorProps) {
  const { updateBlockParams } = useAppActions()
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
              onClick={() => updateBlockParams(block.id, { workSec: preset.workSec, restSec: preset.restSec, rounds: preset.rounds })}
            >
              {preset.label}
            </Chip>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {keys.map((key) => (
          <ParamField key={key} param={key} value={p[key]} onChange={(value) => updateBlockParams(block.id, { [key]: value })} />
        ))}
      </div>
    </div>
  )
}
