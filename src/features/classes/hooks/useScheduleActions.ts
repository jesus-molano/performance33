// Admin changes to the timetable and the booking rules (the database refuses anyone else).

import { useMemo } from 'react'
import type { BookingSettings } from '@shared/booking'
import { useConfirm } from '@/hooks'
import { SCHEDULE_COPY, WEEKDAY_NAMES } from '@/features/classes/config/copy'
import { classesService } from '@/features/classes/services/instance'
import type { ClassTemplate, ClassTemplateInput } from '@/features/classes/types'
import { formatMinutesOfDay } from '@/features/classes/utils/time'
import { useClassRunner } from './useClassRunner'

export interface ScheduleActions {
  /** True when saved. */
  saveTemplates: (templates: ClassTemplateInput[]) => Promise<boolean>
  /** Asks first; true when removed. */
  removeTemplate: (template: ClassTemplate) => Promise<boolean>
  saveSettings: (settings: BookingSettings) => void
}

export function useScheduleActions(): ScheduleActions {
  const { run, toast } = useClassRunner()
  const confirm = useConfirm()
  const { toast: show } = toast

  return useMemo(
    () => ({
      async saveTemplates(templates) {
        const saved = (await run(() => classesService.saveTemplates(templates))) !== null
        const added = templates.filter((t) => !t.id).length
        if (saved) show({ message: added > 1 ? SCHEDULE_COPY.savedMany(added) : SCHEDULE_COPY.saved })
        return saved
      },

      async removeTemplate(template) {
        const day = WEEKDAY_NAMES[template.weekday - 1]
        const time = formatMinutesOfDay(template.startMinutes)
        const confirmed = await confirm({
          title: SCHEDULE_COPY.removeTitle(day, time),
          description: SCHEDULE_COPY.removeText,
          confirmLabel: SCHEDULE_COPY.remove,
          danger: true,
        })
        if (!confirmed) return false
        const removed = (await run(() => classesService.removeTemplate(template.id))) !== null
        if (removed) show({ message: SCHEDULE_COPY.removed(day, time) })
        return removed
      },

      saveSettings(settings) {
        void run(() => classesService.saveSettings(settings)).then((saved) => {
          if (saved !== null) show({ message: SCHEDULE_COPY.rulesSaved })
        })
      },
    }),
    [run, show, confirm],
  )
}
