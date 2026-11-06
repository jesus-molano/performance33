import { useId } from 'react'
import { gymMinutesOfDay, type GymDate } from '@shared/booking'
import { Button, Modal } from '@/components/ui'
import { DEFAULT_CLASS_CAPACITY, DEFAULT_CLASS_DURATION, DEFAULT_CLASS_NAME } from '@/features/classes/config/classes'
import { SLOT_FORM_COPY } from '@/features/classes/config/copy'
import { useClassForm } from '@/features/classes/hooks/useClassForm'
import { useSlotActions } from '@/features/classes/hooks/useSlotActions'
import type { SlotSummary } from '@/features/classes/types'
import { capacityBelowBooked, defaultStartMinutes, type ClassFormValues } from '@/features/classes/utils/classForm'
import { formatGymDay } from '@/features/classes/utils/time'
import { ClassFields } from './ClassFields'

export interface SlotFormModalProps {
  /** Null: a new one-off class on `date`. */
  slot: SlotSummary | null
  date: GymDate
  now: number
  onClose: () => void
  onCreated: (slotId: string) => void
}

function initialValues(slot: SlotSummary | null, date: GymDate, now: number): ClassFormValues {
  if (slot) {
    return { name: slot.name, startMinutes: gymMinutesOfDay(slot.startsAt), durationMinutes: slot.durationMinutes, capacity: String(slot.capacity) }
  }
  return { name: DEFAULT_CLASS_NAME, startMinutes: defaultStartMinutes(date, now), durationMinutes: DEFAULT_CLASS_DURATION, capacity: String(DEFAULT_CLASS_CAPACITY) }
}

/** Add a class to this day, or edit one (render only while open, so it starts fresh). */
export function SlotFormModal({ slot, date, now, onClose, onCreated }: SlotFormModalProps) {
  const actions = useSlotActions()
  const formId = useId()
  const form = useClassForm(initialValues(slot, date, now), async (values) => {
    if (slot) {
      if (await actions.save(slot, values)) onClose()
      return true
    }
    const id = await actions.create(date, values)
    if (id) onCreated(id)
    return id !== null
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={slot ? SLOT_FORM_COPY.editTitle : SLOT_FORM_COPY.newTitle}
      description={<span className="block first-letter:uppercase">{formatGymDay(date)}</span>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {SLOT_FORM_COPY.cancel}
          </Button>
          <Button type="submit" form={formId} disabled={form.busy}>
            {slot ? SLOT_FORM_COPY.save : SLOT_FORM_COPY.add}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={form.submit} noValidate className="flex flex-col gap-4 pt-1">
        <ClassFields form={form} />
        {slot && capacityBelowBooked(form.values.capacity, slot.bookedCount) && (
          <p className="text-sm font-medium text-amber-800">{SLOT_FORM_COPY.belowBooked(slot.bookedCount)}</p>
        )}
        {slot && !slot.edited && slot.templateId && <p className="text-sm text-fg-muted">{SLOT_FORM_COPY.editedHint}</p>}
      </form>
    </Modal>
  )
}
