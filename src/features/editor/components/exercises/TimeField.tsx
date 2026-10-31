import { useId, useState, type KeyboardEvent, type RefObject } from 'react'
import { suffixFrameClasses } from '@/components/ui/styles'
import { useValueDraft } from '@/hooks'
import { breakUndoGroup } from '@/store'
import { inputToSeconds, preferredTimeUnit, secondsToInput, type TimeUnit } from '@/features/editor/utils'

const UNIT_LABEL: Record<TimeUnit, string> = { sec: 's', min: 'min' }
const UNIT_NAME: Record<TimeUnit, string> = { sec: 'segundos', min: 'minutos' }

export interface TimeFieldProps {
  seconds: number | null
  onChange: (seconds: number | null) => void
  inputRef: RefObject<HTMLInputElement | null>
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Duration typed in seconds or minutes (the store always keeps seconds). The unit is a button
 * inside the field: tap to switch s ⇄ min. '1,5' min is typed freely and saved as 90 s.
 */
export function TimeField({ seconds, onChange, inputRef, onKeyDown }: TimeFieldProps) {
  const id = useId()
  const [unit, setUnit] = useState<TimeUnit>(() => preferredTimeUnit(seconds))
  const draft = useValueDraft({
    value: seconds,
    format: (value) => secondsToInput(value, unit),
    parse: (text) => inputToSeconds(text, unit),
    onCommit: onChange,
    resetKey: unit,
  })
  const otherUnit: TimeUnit = unit === 'sec' ? 'min' : 'sec'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        Tiempo
      </label>
      <div className={`flex items-center ${suffixFrameClasses(false)}`}>
        <input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          value={draft.text}
          placeholder={unit === 'sec' ? '30' : '1'}
          onChange={(e) => draft.onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            draft.onBlur()
            breakUndoGroup()
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-base font-semibold text-fg tabular placeholder:text-fg-subtle focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setUnit(otherUnit)}
          aria-label={`Unidad: ${UNIT_NAME[unit]}. Cambiar a ${UNIT_NAME[otherUnit]}`}
          className="mr-1 h-9 min-w-11 shrink-0 rounded-lg bg-fg/5 px-2 text-sm font-semibold text-fg-muted hover:bg-fg/10 hover:text-fg"
        >
          {UNIT_LABEL[unit]}
        </button>
      </div>
    </div>
  )
}
