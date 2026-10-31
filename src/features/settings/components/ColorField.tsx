import { useId, type ReactNode } from 'react'
import { Input } from '@/components/ui'
import { useHexDraft } from '@/features/settings/hooks/useHexDraft'

export interface ColorFieldProps {
  label: string
  hint?: ReactNode
  value: string
  onChange: (hex: string) => void
  onEditEnd: () => void
  /** Extra message under the field (e.g. a contrast warning). */
  warning?: string
}

/** Native colour picker + editable hex code. */
export function ColorField({ label, hint, value, onChange, onEditEnd, warning }: ColorFieldProps) {
  const { draft, invalid, change } = useHexDraft(value, onChange)
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <div className="flex items-start gap-2">
        <input
          type="color"
          aria-label={`${label}: selector`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onEditEnd}
          className="size-11 shrink-0 cursor-pointer rounded-xl border border-line-strong bg-surface p-1"
        />
        <Input
          id={id}
          value={draft}
          onChange={(e) => change(e.target.value)}
          onBlur={onEditEnd}
          error={invalid ? 'Usa el formato #rrggbb' : undefined}
          maxLength={7}
          spellCheck={false}
          className="font-mono uppercase"
          containerClassName="flex-1"
        />
      </div>
      {warning ? <p className="text-sm text-amber-700">{warning}</p> : hint && <p className="text-sm text-fg-muted">{hint}</p>}
    </div>
  )
}
