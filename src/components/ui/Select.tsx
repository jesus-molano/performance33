import { ChevronDown } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './styles'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export interface SelectProps<T extends string = string> extends Omit<ComponentProps<'select'>, 'onChange' | 'value'> {
  options: ReadonlyArray<SelectOption<T>>
  value: T
  onChange: (value: T) => void
  label?: ReactNode
  hint?: ReactNode
  error?: string
  containerClassName?: string
}

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  ...props
}: SelectProps<T>) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <Field id={selectId} label={label} hint={hint} error={error} className={containerClassName}>
      <div className="relative flex items-center">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-describedby={describedBy(selectId, hint, error)}
          className={controlClasses(!!error, cn('h-11 appearance-none pr-10', className))}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-3.5 text-fg-subtle" />
      </div>
    </Field>
  )
}
