import { useId, type ComponentProps, type ReactNode } from 'react'
import { NATIVE_UNDO_ATTRIBUTE } from '@/hooks/useUndoShortcuts'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './styles'

export interface TextareaProps extends ComponentProps<'textarea'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  /** Value is local state: keep the browser's own Ctrl+Z. */
  nativeUndo?: boolean
  containerClassName?: string
}

export function Textarea({
  label,
  hint,
  error,
  nativeUndo = false,
  containerClassName,
  className,
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const autoId = useId()
  const textareaId = id ?? autoId
  return (
    <Field id={textareaId} label={label} hint={hint} error={error} className={containerClassName}>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, hint, error)}
        {...(nativeUndo ? { [NATIVE_UNDO_ATTRIBUTE]: '' } : {})}
        className={controlClasses(!!error, cn('resize-y py-2.5 leading-relaxed', className))}
        {...props}
      />
    </Field>
  )
}
