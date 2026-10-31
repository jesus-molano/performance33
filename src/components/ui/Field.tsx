import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface FieldProps {
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
}

/** Label + control + hint/error, shared by Input, Textarea and Select. */
export function Field({ id, label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
