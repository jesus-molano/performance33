import { useId } from 'react'
import { controlClasses, PrivacyLabel } from '@/components/ui'
import { cn } from '@/lib/cn'
import { breakUndoGroup } from '@/store'

export interface VisibleTextFieldProps {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  multiline?: boolean
  autoFocus?: boolean
  className?: string
}

/** Store-bound text that the client WILL see on the TV: pink eye label 'Lo verá el cliente'. */
export function VisibleTextField({ label, value, placeholder, onChange, multiline, autoFocus, className }: VisibleTextFieldProps) {
  const id = useId()
  const shared = {
    id,
    value,
    placeholder,
    autoFocus,
    onBlur: breakUndoGroup,
  }
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        <PrivacyLabel kind="visible" />
      </div>
      {multiline ? (
        <textarea
          {...shared}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className={controlClasses(false, 'resize-y py-2.5 leading-relaxed')}
        />
      ) : (
        <input {...shared} onChange={(e) => onChange(e.target.value)} className={controlClasses(false, 'h-11')} />
      )}
    </div>
  )
}
