import type { LucideIcon } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { NATIVE_UNDO_ATTRIBUTE } from '@/hooks/useUndoShortcuts'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { controlClasses, describedBy, suffixFrameClasses } from './styles'

export interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  leftIcon?: LucideIcon
  /** Right-side adornment, e.g. a unit ('kg', '% 1RM'). Laid out in flow, so it never covers the value. */
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
  const hasSuffix = suffix != null
  return (
    <Field id={inputId} label={label} hint={hint} error={error} className={containerClassName}>
      <div className={cn('relative flex items-center', hasSuffix && suffixFrameClasses(!!error))}>
        {LeftIcon && <LeftIcon size={18} aria-hidden className="pointer-events-none absolute left-3.5 text-fg-subtle" />}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, hint, error)}
          {...(nativeUndo ? { [NATIVE_UNDO_ATTRIBUTE]: '' } : {})}
          className={
            hasSuffix
              ? cn('h-full min-w-0 flex-1 bg-transparent px-3.5 text-md text-fg placeholder:text-fg-subtle focus:outline-none', LeftIcon && 'pl-10', className)
              : controlClasses(!!error, cn('h-11', LeftIcon && 'pl-10', className))
          }
          {...props}
        />
        {hasSuffix && <span className="shrink-0 pr-3 text-sm whitespace-nowrap text-fg-muted">{suffix}</span>}
      </div>
    </Field>
  )
}
