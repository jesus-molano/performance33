import { Check, Copy, KeyRound } from 'lucide-react'
import { Button, Callout, Modal } from '@/components/ui'
import { useCopyText } from '@/hooks'
import { CREDENTIALS_COPY } from '@/features/members/config/copy'
import type { MemberCredentials } from '@/features/members/types'
import { QrLink } from './QrLink'

export interface MemberCredentialsModalProps {
  name: string
  credentials: MemberCredentials
  onClose: () => void
}

function CredentialLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-fg-muted">{label}</span>
      <span className="select-all text-xl font-semibold tracking-wide break-all text-fg tabular">{value}</span>
    </div>
  )
}

/** The only time the temporary password can be seen. Render only while there is one. */
export function MemberCredentialsModal({ name, credentials, onClose }: MemberCredentialsModalProps) {
  const { copied, copy } = useCopyText(CREDENTIALS_COPY.clipboard(credentials.username, credentials.temporaryPassword), CREDENTIALS_COPY.copyFailed)
  return (
    <Modal
      open
      persistent
      onClose={onClose}
      size="sm"
      title={CREDENTIALS_COPY.title}
      description={CREDENTIALS_COPY.description(name)}
      footer={<Button onClick={onClose}>{CREDENTIALS_COPY.done}</Button>}
    >
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col gap-3 rounded-xl bg-canvas px-4 py-4">
          <CredentialLine label={CREDENTIALS_COPY.username} value={credentials.username} />
          <CredentialLine label={CREDENTIALS_COPY.password} value={credentials.temporaryPassword} />
        </div>
        <Button variant="secondary" fullWidth leftIcon={copied ? Check : Copy} onClick={() => void copy()}>
          {copied ? CREDENTIALS_COPY.copied : CREDENTIALS_COPY.copy}
        </Button>
        <Callout tone="warning" icon={KeyRound}>
          {CREDENTIALS_COPY.warning}
        </Callout>
        <div className="flex flex-col gap-1">
          <QrLink />
          <p className="text-sm text-fg-muted">{CREDENTIALS_COPY.qrHint}</p>
        </div>
      </div>
    </Modal>
  )
}
