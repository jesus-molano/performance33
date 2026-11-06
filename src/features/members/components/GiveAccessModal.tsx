import { CircleAlert } from 'lucide-react'
import { Button, Callout, Input, Modal } from '@/components/ui'
import { USERNAME_MAX_LENGTH } from '@/lib/accountRules'
import type { Client } from '@/types'
import { GIVE_ACCESS_COPY } from '@/features/members/config/copy'
import { useGiveAccessForm } from '@/features/members/hooks/useGiveAccessForm'
import type { GiveAccessInput } from '@/features/members/types'

const FORM_ID = 'give-member-access'

export interface GiveAccessModalProps {
  client: Client
  busy: boolean
  onSubmit: (input: GiveAccessInput) => Promise<void>
  onClose: () => void
}

/** Username (already suggested) and an optional email. Render only while open. */
export function GiveAccessModal({ client, busy, onSubmit, onClose }: GiveAccessModalProps) {
  const form = useGiveAccessForm(client, onSubmit)
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={GIVE_ACCESS_COPY.title}
      description={GIVE_ACCESS_COPY.description(client.firstName)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {GIVE_ACCESS_COPY.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={busy}>
            {GIVE_ACCESS_COPY.submit}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(event) => void form.submit(event)} className="flex flex-col gap-4 pt-1" noValidate>
        <Input
          label={GIVE_ACCESS_COPY.username}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={form.username}
          maxLength={USERNAME_MAX_LENGTH}
          hint={GIVE_ACCESS_COPY.usernameHint}
          error={form.errors.username}
          onChange={(event) => form.setUsername(event.target.value)}
        />
        <Input
          label={GIVE_ACCESS_COPY.email}
          type="email"
          autoComplete="off"
          value={form.email}
          hint={GIVE_ACCESS_COPY.emailHint}
          error={form.errors.email}
          onChange={(event) => form.setEmail(event.target.value)}
        />
        {form.failure && (
          <Callout tone="warning" icon={CircleAlert}>
            {form.failure}
          </Callout>
        )}
      </form>
    </Modal>
  )
}
