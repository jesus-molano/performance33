import { useState } from 'react'
import { DATE_TEXTS } from '@/config/copy'
import { formatDate } from '@/lib/dates'
import { DATE_TEXT_LENGTH, maskDateText, readDateText, type DateLimits } from '@/lib/dateText'
import type { ISODate } from '@/types'

export interface DateFieldOptions extends DateLimits {
  /** '' when there is no valid date (a form left half-typed). */
  value: ISODate | ''
  /** Gets '' while the text is not a valid date, so a form can refuse to submit it. */
  onChange: (date: ISODate | '') => void
}

export interface DateFieldApi {
  text: string
  error: string | null
  onTextChange: (raw: string) => void
  /** Leaving the field, or pressing Enter (which sends the form without leaving it). */
  onBlur: () => void
  pick: (date: ISODate) => void
}

const toText = (value: ISODate | ''): string => (value ? formatDate(value) : '')

/**
 * The dd/mm/aaaa text of a date field. Half-typed text stays in the field; a complete date is
 * committed at once, and the field follows outside changes (undo, the weeks stepper, another coach).
 * A refused text does not stay on screen looking like the date: the valid one comes back, and the message says so.
 */
export function useDateField({ value, onChange, min, max }: DateFieldOptions): DateFieldApi {
  const [text, setText] = useState(() => toText(value))
  const [error, setError] = useState<string | null>(null)
  const [synced, setSynced] = useState(value)
  if (synced !== value) {
    setSynced(value)
    if (value) {
      setText(toText(value))
      setError(null)
    }
  }

  const commit = (date: ISODate) => {
    setError(null)
    if (date !== value) onChange(date)
  }

  return {
    text,
    error,
    onTextChange: (raw) => {
      const next = maskDateText(raw)
      setText(next)
      if (next.length < DATE_TEXT_LENGTH) {
        setError(null)
        onChange('')
        return
      }
      const result = readDateText(next, { min, max })
      if (result.date) commit(result.date)
      else {
        setError(result.error)
        onChange('')
      }
    },
    onBlur: () => {
      if (!text) {
        setText(toText(value))
        return
      }
      const result = readDateText(text, { min, max })
      if (result.date) {
        setText(toText(result.date))
        commit(result.date)
      } else if (value) {
        setText(toText(value))
        setError(`${result.error} ${DATE_TEXTS.kept(formatDate(value))}`)
      } else setError(result.error)
    },
    pick: (date) => {
      setText(toText(date))
      commit(date)
    },
  }
}
