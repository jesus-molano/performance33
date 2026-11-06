// State of the class and timetable forms: what is typed, the errors after a try, and sending it once valid.

import { useState, type FormEvent } from 'react'
import type { SelectOption } from '@/components/ui'
import { CLASS_DURATION_OPTIONS } from '@/features/classes/config/classes'
import { SLOT_FORM_COPY } from '@/features/classes/config/copy'
import { validateClassForm, type ClassFormErrors, type ClassFormValues, type ValidClassForm } from '@/features/classes/utils/classForm'
import { withCurrent } from '@/features/classes/utils/planQuota'
import { classTimeOptions, formatMinutesOfDay } from '@/features/classes/utils/time'

export interface ClassForm {
  values: ClassFormValues
  errors: ClassFormErrors
  setField: <K extends keyof ClassFormValues>(field: K, value: ClassFormValues[K]) => void
  timeOptions: SelectOption[]
  durationOptions: SelectOption[]
  busy: boolean
  /** `extraError`: a check of the caller (the timetable's days). */
  submit: (event: FormEvent, extraError?: Partial<ClassFormErrors>) => void
}

export function useClassForm(initial: ClassFormValues, onValid: (values: ValidClassForm) => Promise<boolean>): ClassForm {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<ClassFormErrors>({})
  const [busy, setBusy] = useState(false)

  return {
    values,
    errors,
    setField: (field, value) => setValues((current) => ({ ...current, [field]: value })),
    timeOptions: classTimeOptions(initial.startMinutes).map((m) => ({ value: String(m), label: formatMinutesOfDay(m) })),
    durationOptions: withCurrent(CLASS_DURATION_OPTIONS, initial.durationMinutes).map((m) => ({ value: String(m), label: SLOT_FORM_COPY.minutes(m) })),
    busy,
    submit: (event, extraError = {}) => {
      event.preventDefault()
      const { errors: found, valid } = validateClassForm(values)
      const all = { ...found, ...extraError }
      setErrors(all)
      if (!valid || Object.values(all).some(Boolean) || busy) return
      setBusy(true)
      void onValid(valid).finally(() => setBusy(false))
    },
  }
}
