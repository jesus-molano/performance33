import { Card } from '@/components/ui'
import { useTeamPanel } from '@/features/team/hooks/useTeamPanel'
import { AddStaffForm } from './AddStaffForm'
import { TeamMemberRow } from './TeamMemberRow'

/** Ajustes → Equipo (administrators only): who can enter and with which role. */
export function TeamPanel() {
  const panel = useTeamPanel()
  return (
    <div className="flex flex-col gap-6">
      <Card padding="none">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-fg">Equipo</h2>
          <p className="text-sm text-fg-muted">Solo pueden entrar las personas de esta lista.</p>
        </div>
        <ul className="divide-y divide-line">
          {panel.members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              isSelf={member.id === panel.currentId}
              busy={panel.busy}
              onRoleChange={panel.changeRole}
              onActiveChange={(target, active) => void panel.changeActive(target, active)}
            />
          ))}
        </ul>
      </Card>
      <Card padding="lg" className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-fg">Añadir a alguien</h2>
        <AddStaffForm />
      </Card>
    </div>
  )
}
