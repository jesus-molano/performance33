import { CalendarClock, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SettingsSection } from '@/features/settings/components/SettingsSection'
import { SCHEDULE_COPY, WEEKDAY_NAMES } from '@/features/classes/config/copy'
import type { ClassTemplate } from '@/features/classes/types'
import { scheduleByWeekday } from '@/features/classes/utils/classForm'
import { formatMinutesOfDay } from '@/features/classes/utils/time'
import { TemplateFormModal } from './TemplateFormModal'

type Editing = { template: ClassTemplate | null; weekday: number | null } | null

function TemplateTile({ template, canEdit, onEdit }: { template: ClassTemplate; canEdit: boolean; onEdit: () => void }) {
  const time = formatMinutesOfDay(template.startMinutes)
  const body = (
    <>
      <span className="text-md font-semibold text-fg tabular">{time}</span>
      <span className="truncate text-xs text-fg-muted">{template.name}</span>
      <span className="w-full text-xs text-fg-muted" title={SCHEDULE_COPY.templateLine(template.durationMinutes, template.capacity)}>
        {template.active ? (
          <>
            <span className="block truncate xl:hidden">{SCHEDULE_COPY.templateShort(template.durationMinutes, template.capacity)}</span>
            <span className="hidden xl:block">{SCHEDULE_COPY.templateLine(template.durationMinutes, template.capacity)}</span>
          </>
        ) : (
          <span className="block truncate">{SCHEDULE_COPY.inactive}</span>
        )}
      </span>
    </>
  )
  const classes = cn('flex min-h-18 min-w-0 flex-col items-start justify-center rounded-xl border border-line px-3 py-2 text-left', !template.active && 'border-dashed opacity-60')
  if (!canEdit) return <div className={classes}>{body}</div>
  return (
    <button type="button" onClick={onEdit} aria-label={SCHEDULE_COPY.editLabel(WEEKDAY_NAMES[template.weekday - 1], time, template.name)} className={cn(classes, 'hover:bg-canvas')}>
      {body}
    </button>
  )
}

/** The weekly timetable, one row per day; admins tap a class to change it or add more (several days at once). */
export function WeeklySchedule({ templates, canEdit }: { templates: ClassTemplate[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<Editing>(null)
  const days = scheduleByWeekday(templates)
  const add = (weekday: number | null) => setEditing({ template: null, weekday })

  return (
    <SettingsSection
      title={SCHEDULE_COPY.scheduleTitle}
      description={SCHEDULE_COPY.scheduleDescription}
      action={canEdit && <Button leftIcon={Plus} onClick={() => add(null)}>{SCHEDULE_COPY.addTemplate}</Button>}
    >
      {templates.length === 0 ? (
        <EmptyState icon={CalendarClock} title={SCHEDULE_COPY.emptyTitle} description={SCHEDULE_COPY.emptyText} />
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {days.map((day, i) => (
            <section key={WEEKDAY_NAMES[i]} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex min-h-11 items-center justify-between gap-2">
                <h3 className="text-md font-semibold text-fg">{WEEKDAY_NAMES[i]}</h3>
                {canEdit && <Button variant="ghost" size="sm" leftIcon={Plus} onClick={() => add(i + 1)} aria-label={`${SCHEDULE_COPY.addTemplate} · ${WEEKDAY_NAMES[i]}`}>{SCHEDULE_COPY.addTemplate}</Button>}
              </div>
              {day.length === 0 ? (
                <p className="text-sm text-fg-subtle">{SCHEDULE_COPY.noTemplates}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
                  {day.map((template) => (
                    <TemplateTile key={template.id} template={template} canEdit={canEdit} onEdit={() => setEditing({ template, weekday: template.weekday })} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
      {editing && <TemplateFormModal template={editing.template} weekday={editing.weekday} onClose={() => setEditing(null)} />}
    </SettingsSection>
  )
}
