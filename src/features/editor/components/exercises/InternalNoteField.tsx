import { useId } from 'react'
import { PrivacyLabel, PrivateSurface } from '@/components/ui'
import { breakUndoGroup } from '@/store'

export interface InternalNoteFieldProps {
  value: string
  onChange: (note: string) => void
}

/** PRIVATE per-exercise note (amber + lock). Never reaches the TV: toDisplayData drops it. */
export function InternalNoteField({ value, onChange }: InternalNoteFieldProps) {
  const id = useId()
  return (
    <PrivateSurface className="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          Nota interna
        </label>
        <PrivacyLabel kind="private" />
      </div>
      <textarea
        id={id}
        rows={2}
        value={value}
        placeholder="Ej. Rodilla izq.: limitar profundidad. No se muestra en la pantalla."
        onBlur={breakUndoGroup}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-private-line bg-white/80 px-3 py-2 text-md leading-relaxed text-fg placeholder:text-private/60 focus:border-private-icon focus:ring-3 focus:ring-private-icon/20 focus:outline-none"
      />
    </PrivateSurface>
  )
}
