// The timetable form: a new entry can go on several days at once; an existing one keeps one day and can be paused.

import { useState, type FormEvent } from 'react'
import { DEFAULT_CLASS_CAPACITY, DEFAULT_CLASS_DURATION, DEFAULT_CLASS_NAME, DEFAULT_CLASS_START_MINUTES } from '@/features/classes/config/classes'
import type { ClassTemplate } from '@/features/classes/types'
import { validateDays } from '@/features/classes/utils/classForm'
import { useClassForm, type ClassForm } from './useClassForm'
import { useScheduleActions } from './useScheduleActions'

export interface TemplateForm {
  form: ClassForm
  isEdit: boolean
  days: number[]
  toggleDay: (weekday: number) => void
  active: boolean
  setActive: (active: boolean) => void
  submit: (event: FormEvent) => void
  remove: () => void
}

export function useTemplateForm(template: ClassTemplate | null, weekday: number | null, onDone: () => void): TemplateForm {
  const actions = useScheduleActions()
  const [days, setDays] = useState<number[]>(template ? [template.weekday] : weekday ? [weekday] : [])
  const [active, setActive] = useState(template?.active ?? true)
  const form = useClassForm(
    template
      ? { name: template.name, startMinutes: template.startMinutes, durationMinutes: template.durationMinutes, capacity: String(template.capacity) }
      : { name: DEFAULT_CLASS_NAME, startMinutes: DEFAULT_CLASS_START_MINUTES, durationMinutes: DEFAULT_CLASS_DURATION, capacity: String(DEFAULT_CLASS_CAPACITY) },
    async (values) => {
      const inputs = template ? [{ ...values, id: template.id, weekday: days[0], active }] : days.map((day) => ({ ...values, weekday: day, active: true }))
      const saved = await actions.saveTemplates(inputs)
      if (saved) onDone()
      return saved
    },
  )

  return {
    form,
    isEdit: template !== null,
    days,
    // Editing moves the entry to one day; a new one may take several.
    toggleDay: (day) => setDays((current) => (template ? [day] : current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b))),
    active,
    setActive,
    submit: (event) => form.submit(event, { days: validateDays(days) }),
    remove: () => {
      if (template) void actions.removeTemplate(template).then((removed) => removed && onDone())
    },
  }
}
