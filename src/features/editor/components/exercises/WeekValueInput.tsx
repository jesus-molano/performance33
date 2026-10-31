import { useId } from 'react'
import { cn } from '@/lib/cn'
import { breakUndoGroup } from '@/store'

export interface WeekValueInputProps {
  week: number
  isCurrent: boolean
  value: string
  placeholder: string
  onChange: (value: string) => void
}

/** One S1..SN slot; the running week is highlighted (that is what the TV shows today). */
export function WeekValueInput({ week, isCurrent, value, placeholder, onChange }: WeekValueInputProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={cn('text-xs font-semibold', isCurrent ? 'text-emerald-700' : 'text-fg-muted')}>
        S{week}
        {isCurrent && <span className="ml-1 font-normal">· hoy</span>}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={breakUndoGroup}
        className={cn(
          'h-11 w-full min-w-0 rounded-xl border bg-surface px-2 text-center text-md font-semibold tabular',
          'placeholder:font-normal placeholder:text-fg-subtle focus:border-brand-strong focus:ring-3 focus:ring-brand-strong/15 focus:outline-none',
          isCurrent ? 'border-emerald-400' : 'border-line-strong',
        )}
      />
    </div>
  )
}
