import { Trash2 } from 'lucide-react'
import { useId } from 'react'
import { Button, Chip, Field, Modal, Switch } from '@/components/ui'
import { SCHEDULE_COPY, SLOT_FORM_COPY, WEEKDAY_LETTERS, WEEKDAY_NAMES } from '@/features/classes/config/copy'
import { useTemplateForm } from '@/features/classes/hooks/useTemplateForm'
import type { ClassTemplate } from '@/features/classes/types'
import { ClassFields } from './ClassFields'

export interface TemplateFormModalProps {
  /** Null: a new entry (on `weekday` when given). */
  template: ClassTemplate | null
  weekday: number | null
  onClose: () => void
}

/** Add or edit a class of the weekly timetable (admins). Render only while open. */
export function TemplateFormModal({ template, weekday, onClose }: TemplateFormModalProps) {
  const t = useTemplateForm(template, weekday, onClose)
  const formId = useId()
  return (
    <Modal
      open
      onClose={onClose}
      title={t.isEdit ? SCHEDULE_COPY.formEdit : SCHEDULE_COPY.formNew}
      footer={
        <>
          {t.isEdit && (
            <Button variant="ghost" leftIcon={Trash2} onClick={t.remove} className="text-red-700 sm:mr-auto">
              {SCHEDULE_COPY.remove}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {SLOT_FORM_COPY.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={t.form.busy}>
            {SLOT_FORM_COPY.save}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={t.submit} noValidate className="flex flex-col gap-4 pt-1">
        <Field id={`${formId}-days`} label={SCHEDULE_COPY.days} error={t.form.errors.days}>
          <div role="group" aria-label={SCHEDULE_COPY.days} className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_LETTERS.map((letter, i) => (
              <Chip key={letter} active={t.days.includes(i + 1)} onClick={() => t.toggleDay(i + 1)} aria-label={WEEKDAY_NAMES[i]} className="px-0">
                {letter}
              </Chip>
            ))}
          </div>
        </Field>
        <ClassFields form={t.form} />
        {t.isEdit && <Switch checked={t.active} onChange={t.setActive} label={SCHEDULE_COPY.active} description={SCHEDULE_COPY.activeHint} />}
      </form>
    </Modal>
  )
}
