import { CalendarDays } from 'lucide-react'
import type { ReactNode } from 'react'
import { DATE_TEXTS } from '@/config/copy'
import { useDateField, type DateFieldOptions } from '@/hooks/useDateField'
import { useDisclosure } from '@/hooks/useDisclosure'
import { DATE_TEXT_LENGTH } from '@/lib/dateText'
import type { ISODate } from '@/types'
import { CalendarDialog } from './CalendarDialog'
import { IconButton } from './IconButton'
import { Input } from './Input'

export interface DateFieldProps extends DateFieldOptions {
  label?: ReactNode
  hint?: ReactNode
  /** An error from the form; the field's own (a date that does not exist) goes first. */
  error?: string
  containerClassName?: string
}

/** Date in dd/mm/aaaa in any browser: type it (the slashes appear by themselves) or pick it from the calendar. */
export function DateField({ label, hint, error, containerClassName, ...options }: DateFieldProps) {
  const field = useDateField(options)
  const calendar = useDisclosure()
  const pick = (date: ISODate) => {
    field.pick(date)
    calendar.close()
  }

  return (
    <>
      <Input
        label={label}
        hint={hint}
        error={field.error ?? error}
        inputMode="numeric"
        autoComplete="off"
        placeholder={DATE_TEXTS.placeholder}
        maxLength={DATE_TEXT_LENGTH}
        value={field.text}
        onChange={(event) => field.onTextChange(event.target.value)}
        onBlur={field.onBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter') field.onBlur()
        }}
        nativeUndo
        className="tabular"
        containerClassName={containerClassName}
        suffix={<IconButton icon={CalendarDays} label={DATE_TEXTS.openCalendar} onClick={calendar.open} className="-mr-3" />}
      />
      {calendar.isOpen && <CalendarDialog value={options.value} min={options.min} max={options.max} onPick={pick} onClose={calendar.close} />}
    </>
  )
}
