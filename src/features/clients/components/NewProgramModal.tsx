import { useId } from 'react'
import { Button, DateField, Input, Modal, Switch } from '@/components/ui'
import { TRAINING_DAY_OPTIONS } from '@/config/plans'
import { formatDate } from '@/lib/dates'
import { plural } from '@/lib/format'
import { getProgramDisplayName } from '@/lib/program'
import type { Client, Program } from '@/types'
import { PROGRAM_WEEK_CHOICES } from '@/features/clients/config'
import { useNewProgramForm } from '@/features/clients/hooks/useNewProgramForm'
import { NumberChoice } from './NumberChoice'

export interface NewProgramModalProps {
  client: Client
  current: Program | null
  onClose: () => void
}

/** 'Nueva rutina': blank or copied from the current one. Opens the editor when created. */
export function NewProgramModal({ client, current, onClose }: NewProgramModalProps) {
  const { values, setField, endDate, canCopy, startDateError, submit } = useNewProgramForm(client, current)
  const formId = useId()
  const copying = canCopy && values.fromCurrent

  return (
    <Modal
      open
      onClose={onClose}
      title={`Nueva rutina para ${client.firstName}`}
      description="Pasará a ser su rutina actual. La anterior queda en el historial."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            Crear y editar
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-5 pt-1">
        {current && (
          <Switch
            checked={values.fromCurrent}
            onChange={(checked) => setField('fromCurrent', checked)}
            label="Partir de la rutina actual"
            description={`Copia los días y ejercicios de «${getProgramDisplayName(current)}».`}
          />
        )}
        {!copying && (
          <Input label="Nombre (opcional)" placeholder="Ej.: Fuerza otoño" value={values.name} onChange={(e) => setField('name', e.target.value)} />
        )}
        <DateField
          label="Empieza el"
          value={values.startDate}
          onChange={(date) => setField('startDate', date)}
          hint={endDate ? `Termina el ${formatDate(endDate)}` : undefined}
          error={startDateError}
          containerClassName="sm:max-w-60"
        />
        {!copying && (
          <>
            <NumberChoice label="Semanas" options={PROGRAM_WEEK_CHOICES} value={values.weeks} onChange={(weeks) => setField('weeks', weeks)} optionLabel={(n) => plural(n, 'semana', 'semanas')} />
            <NumberChoice
              label="Días de entrenamiento"
              options={TRAINING_DAY_OPTIONS}
              value={values.dayCount}
              onChange={(days) => setField('dayCount', days)}
              optionLabel={(n) => plural(n, 'día', 'días')}
            />
          </>
        )}
      </form>
    </Modal>
  )
}
