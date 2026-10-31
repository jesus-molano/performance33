import { HelpTip, Input } from '@/components/ui'
import { BLOCK_PARAM_META, type BlockParamKey } from '@/config/blockTypes'
import { parseOptionalInt } from '@/lib/numbers'
import { breakUndoGroup } from '@/store'
import type { BlockParams } from '@/types'

export interface ParamFieldProps {
  param: BlockParamKey
  value: BlockParams[BlockParamKey]
  /** `undefined` clears the param. */
  onChange: (value: BlockParams[BlockParamKey]) => void
}

/** One block parameter (rondas, minutos, trabajo/descanso…). Free text only for the rep scheme. */
export function ParamField({ param, value, onChange }: ParamFieldProps) {
  const meta = BLOCK_PARAM_META[param]
  const isText = param === 'repScheme'
  return (
    <Input
      label={
        <span className="inline-flex items-center gap-1.5">
          {meta.label}
          {meta.help && <HelpTip text={meta.help} />}
        </span>
      }
      value={value ?? ''}
      inputMode={isText ? 'text' : 'numeric'}
      placeholder={isText ? '21-15-9' : undefined}
      suffix={meta.unit || undefined}
      onBlur={breakUndoGroup}
      onChange={(e) => {
        if (isText) onChange(e.target.value || undefined)
        else onChange(parseOptionalInt(e.target.value) ?? undefined)
      }}
      className="tabular"
    />
  )
}
