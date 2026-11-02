import { useId } from 'react'
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker'
import { Avatar, Button, Input, Modal } from '@/components/ui'
import type { StaffMember } from '@/types'
import { STAFF_NAME_MAX_LENGTH } from '@/features/team/config'
import { useProfileForm } from '@/features/team/hooks/useProfileForm'

export interface ProfileModalProps {
  staff: StaffMember
  onClose: () => void
}

/** 'Mi perfil' (own name and colour). Render it only while open. */
export function ProfileModal({ staff, onClose }: ProfileModalProps) {
  const form = useProfileForm(staff, onClose)
  const formId = useId()
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Mi perfil"
      description={staff.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={form.busy}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-5" noValidate>
        <div className="flex justify-center pt-1">
          <Avatar firstName={form.name || '?'} color={form.color} size="xl" />
        </div>
        <Input
          label="Nombre"
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
          maxLength={STAFF_NAME_MAX_LENGTH}
          error={form.error}
          autoComplete="off"
        />
        <ColorSwatchPicker label="Color" value={form.color} onChange={form.setColor} />
      </form>
    </Modal>
  )
}
