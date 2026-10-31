import { useId } from 'react'
import { ColorSwatchPicker } from '../../../components/ColorSwatchPicker'
import { Button, Input, Modal, PrivacyLabel, Textarea } from '../../../components/ui'
import { TRAINING_DAY_OPTIONS } from '../../../config/plans'
import { plural } from '../../../lib/format'
import type { Client } from '../../../types'
import { CLIENT_TEXT } from '../config'
import { useClientForm } from '../hooks/useClientForm'
import { NumberChoice } from './NumberChoice'
import { PlanPicker } from './PlanPicker'

export interface ClientFormModalProps {
  /** null = new client. */
  client: Client | null
  onClose: () => void
}

/** Add / edit client. Render it only while open so it starts fresh. */
export function ClientFormModal({ client, onClose }: ClientFormModalProps) {
  const { isEdit, values, errors, setField, setPlan, submit } = useClientForm(client, onClose)
  const formId = useId()

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Editar datos del cliente' : 'Nuevo cliente'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            {isEdit ? 'Guardar cambios' : 'Añadir cliente'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-5 pt-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" value={values.firstName} onChange={(e) => setField('firstName', e.target.value)} error={errors.firstName} autoFocus autoComplete="off" />
          <Input
            label="Apellidos"
            hint="No aparecen en la pantalla del gimnasio."
            value={values.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            autoComplete="off"
          />
        </div>
        <PlanPicker value={values.plan} onChange={setPlan} />
        <NumberChoice
          label="Días de entrenamiento por semana"
          hint="Las rutinas nuevas tendrán este número de días."
          options={TRAINING_DAY_OPTIONS}
          value={values.trainingDays}
          onChange={(days) => setField('trainingDays', days)}
          optionLabel={(n) => plural(n, 'día', 'días')}
        />
        <Input
          type="date"
          label="Fecha de alta"
          value={values.startDate}
          onChange={(e) => setField('startDate', e.target.value)}
          error={errors.startDate}
          containerClassName="sm:max-w-60"
        />
        <Textarea
          label={
            <span className="flex flex-wrap items-center gap-2">
              Objetivo <PrivacyLabel kind="private" />
            </span>
          }
          placeholder={CLIENT_TEXT.goalPlaceholder}
          value={values.goal}
          onChange={(e) => setField('goal', e.target.value)}
          rows={2}
        />
        <ColorSwatchPicker label="Color del avatar" value={values.color} onChange={(color) => setField('color', color)} />
      </form>
    </Modal>
  )
}
