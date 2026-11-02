import { CircleAlert } from 'lucide-react'
import { Callout, Card } from '@/components/ui'
import { TEAM_COPY } from '@/features/team/config'
import { useTeamPanel } from '@/features/team/hooks/useTeamPanel'
import { CreateAccountForm } from './CreateAccountForm'
import { TeamAccountRow } from './TeamAccountRow'
import { TemporaryPasswordModal } from './TemporaryPasswordModal'

/** Ajustes → Equipo (administrators only): who has an account, how they enter and with which role. */
export function TeamPanel() {
  const panel = useTeamPanel()
  return (
    <div className="flex flex-col gap-6">
      <Card padding="none">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-fg">{TEAM_COPY.panelTitle}</h2>
          <p className="text-sm text-fg-muted">{TEAM_COPY.panelDescription}</p>
        </div>
        {panel.loadFailed && (
          <Callout tone="warning" icon={CircleAlert} className="m-4">
            {TEAM_COPY.loadFailed}
          </Callout>
        )}
        <ul className="divide-y divide-line">
          {panel.accounts.map((account) => (
            <TeamAccountRow
              key={account.id}
              account={account}
              isSelf={account.id === panel.currentId}
              busy={panel.busy}
              onRoleChange={panel.changeRole}
              onActiveChange={(target, active) => void panel.changeActive(target, active)}
              onResetPassword={(target) => void panel.resetPassword(target)}
              onRemove={(target) => void panel.remove(target)}
            />
          ))}
        </ul>
      </Card>
      <Card padding="lg" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-fg">{TEAM_COPY.createTitle}</h2>
        <CreateAccountForm accounts={panel.accounts} onCreated={panel.showTemporary} />
      </Card>
      {panel.temporary && <TemporaryPasswordModal temporary={panel.temporary} onClose={panel.closeTemporary} />}
    </div>
  )
}
