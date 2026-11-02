import { useId } from 'react'
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker'
import { Avatar, Button, Input, Modal } from '@/components/ui'
import { ACCOUNT_NAME_MAX_LENGTH } from '@/lib/accountRules'
import type { Profile } from '@/types'
import { useProfileForm } from '@/features/team/hooks/useProfileForm'
import { ChangePasswordSection } from './ChangePasswordSection'
import { GoogleConnectionSection } from './GoogleConnectionSection'

export interface ProfileModalProps {
  profile: Profile
  onClose: () => void
}

/** 'Mi perfil': own name and colour, username to look at, own password and Google. Render it only while open. */
export function ProfileModal({ profile, onClose }: ProfileModalProps) {
  const form = useProfileForm(profile, onClose)
  const formId = useId()
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Mi perfil"
      description={profile.email ?? undefined}
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
      <div className="flex flex-col gap-5">
        <form id={formId} onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-5" noValidate>
          <div className="flex justify-center pt-1">
            <Avatar firstName={form.name || '?'} color={form.color} size="xl" />
          </div>
          <Input
            label="Nombre"
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            maxLength={ACCOUNT_NAME_MAX_LENGTH}
            error={form.error}
            autoComplete="off"
          />
          <Input label="Usuario" value={profile.username} readOnly hint="Con esto entras." className="text-fg-muted" />
          <ColorSwatchPicker label="Color" value={form.color} onChange={form.setColor} />
        </form>
        <ChangePasswordSection />
        <GoogleConnectionSection />
      </div>
    </Modal>
  )
}
