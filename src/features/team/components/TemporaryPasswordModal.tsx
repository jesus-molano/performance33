import { Check, Copy, KeyRound } from 'lucide-react'
import { Button, Callout, Modal } from '@/components/ui'
import { TEAM_COPY } from '@/features/team/config'
import { useCopyText } from '@/features/team/hooks/useCopyText'
import type { TemporaryPassword } from '@/features/team/hooks/useTeamPanel'

export interface TemporaryPasswordModalProps {
  temporary: TemporaryPassword
  onClose: () => void
}

/** The only time this password can be seen. Render only while there is one. */
export function TemporaryPasswordModal({ temporary, onClose }: TemporaryPasswordModalProps) {
  const { copied, copy } = useCopyText(temporary.password)
  return (
    <Modal
      open
      persistent
      onClose={onClose}
      size="sm"
      title={TEAM_COPY.temporaryTitle}
      description={`Para ${temporary.name}. Entrará con el usuario «${temporary.username}».`}
      footer={<Button onClick={onClose}>Ya la he apuntado</Button>}
    >
      <div className="flex flex-col gap-4 pt-1">
        <p className="select-all rounded-xl bg-canvas px-4 py-4 text-center text-2xl font-semibold tracking-wide break-all text-fg tabular">
          {temporary.password}
        </p>
        <Button variant="secondary" fullWidth leftIcon={copied ? Check : Copy} onClick={() => void copy()}>
          {copied ? TEAM_COPY.copied : TEAM_COPY.copy}
        </Button>
        <Callout tone="warning" icon={KeyRound}>
          {TEAM_COPY.temporaryWarning}
        </Callout>
        <p className="text-sm text-fg-muted">{TEAM_COPY.temporaryInstructions}</p>
      </div>
    </Modal>
  )
}
