import { BOOKING_LIMITS } from '@shared/booking'
import { Input, Select } from '@/components/ui'
import { SLOT_FORM_COPY } from '@/features/classes/config/copy'
import type { ClassForm } from '@/features/classes/hooks/useClassForm'

/** Name, time, length and places: the same fields for a class of the day and for the timetable. */
export function ClassFields({ form }: { form: ClassForm }) {
  const { values, errors, setField } = form
  return (
    <>
      <Input
        label={SLOT_FORM_COPY.name}
        value={values.name}
        maxLength={BOOKING_LIMITS.className.max}
        onChange={(e) => setField('name', e.target.value)}
        error={errors.name}
        autoComplete="off"
        nativeUndo
      />
      <div className="grid grid-cols-3 gap-3">
        <Select
          label={SLOT_FORM_COPY.time}
          options={form.timeOptions}
          value={String(values.startMinutes)}
          onChange={(value) => setField('startMinutes', Number(value))}
        />
        <Select
          label={SLOT_FORM_COPY.duration}
          options={form.durationOptions}
          value={String(values.durationMinutes)}
          onChange={(value) => setField('durationMinutes', Number(value))}
        />
        <Input
          label={SLOT_FORM_COPY.capacity}
          inputMode="numeric"
          value={values.capacity}
          onChange={(e) => setField('capacity', e.target.value)}
          error={errors.capacity}
          nativeUndo
        />
      </div>
    </>
  )
}
