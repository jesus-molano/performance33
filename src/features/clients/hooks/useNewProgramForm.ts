import { useState, type FormEvent } from 'react'
import { DEFAULT_PROGRAM_WEEKS } from '@/config/app'
import { endDateFor, isValidISODate, todayISO } from '@/lib/dates'
import { nextBlockStart } from '@/lib/programDates'
import type { Client, ISODate, Program } from '@/types'
import { useProgramActions } from './useProgramActions'

export interface NewProgramValues {
  name: string
  startDate: ISODate
  weeks: number
  dayCount: number
  /** Start from a copy of the current routine ('Duplicar como nueva rutina'). */
  fromCurrent: boolean
}

export interface NewProgramFormApi {
  values: NewProgramValues
  setField: <K extends keyof NewProgramValues>(key: K, value: NewProgramValues[K]) => void
  endDate: ISODate | null
  canCopy: boolean
  submit: (event: FormEvent) => void
}

/** 'Nueva rutina' modal: empty routine or a copy of the current one, then opens the editor. */
export function useNewProgramForm(client: Client, current: Program | null): NewProgramFormApi {
  const { create, duplicateAsNext } = useProgramActions(client.id)
  const [values, setValues] = useState<NewProgramValues>(() => ({
    name: '',
    startDate: current ? nextBlockStart(current) : todayISO(),
    weeks: current?.weeks ?? DEFAULT_PROGRAM_WEEKS,
    dayCount: client.trainingDays,
    fromCurrent: current !== null,
  }))

  const setField: NewProgramFormApi['setField'] = (key, value) => setValues((v) => ({ ...v, [key]: value }))
  const validStart = isValidISODate(values.startDate)
  const copying = values.fromCurrent && current !== null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const startDate = validStart ? values.startDate : todayISO()
    if (copying) duplicateAsNext(current, startDate)
    else create({ name: values.name.trim(), startDate, weeks: values.weeks, dayCount: values.dayCount })
  }

  return {
    values,
    setField,
    endDate: validStart && !copying ? endDateFor(values.startDate, values.weeks) : null,
    canCopy: current !== null,
    submit,
  }
}
