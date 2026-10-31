import type { LucideIcon } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { NATIVE_UNDO_ATTRIBUTE } from '../../hooks/useUndoShortcuts'
import { cn } from '../../lib/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './styles'

export interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  leftIcon?: LucideIcon
  /** Right-side adornment, e.g. a unit ('kg', 's'). */
  suffix?: ReactNode
  /** Value is local state (search, modal form): keep the browser's own Ctrl+Z. */
  nativeUndo?: boolean
  containerClassName?: string
}

export function Input({
  label,
  hint,
  error,
  leftIcon: LeftIcon,
  suffix,
  nativeUndo = false,
  containerClassName,
  className,
  id,
  ...props
}: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field id={inputId} label={label} hint={hint} error={error} className={containerClassName}>
      <div className="relative flex items-center">
        {LeftIcon && <LeftIcon size={18} aria-hidden className="pointer-events-none absolute left-3.5 text-fg-subtle" />}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          {...(nativeUndo ? { [NATIVE_UNDO_ATTRIBUTE]: '' } : {})}
          className={controlClasses(!!error, cn('h-11', LeftIcon && 'pl-10', suffix != null && 'pr-12', className))}
          {...props}
        />
        {suffix != null && (
          <span className="pointer-events-none absolute right-3.5 text-sm text-fg-subtle">{suffix}</span>
        )}
      </div>
    </Field>
  )
}
