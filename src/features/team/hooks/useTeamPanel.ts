import { useCallback, useMemo, useState } from 'react'
import { refreshTeamQuietly, teamService } from '@/auth'
import { useConfirm, useToast } from '@/hooks'
import { accessChangeError } from '@/lib/ownership'
import { useCurrentStaff, useTeam } from '@/store'
import type { StaffAccessPatch, StaffMember, StaffRole } from '@/types'
import { ROLE_LABELS } from '@/features/team/config'

export interface TeamPanelApi {
  members: StaffMember[]
  currentId: string | null
  busy: boolean
  changeRole: (member: StaffMember, role: StaffRole) => void
  changeActive: (member: StaffMember, active: boolean) => Promise<void>
}

const sortMembers = (team: StaffMember[]) =>
  [...team].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'es'))

/** Ajustes → Equipo: role changes and deactivation. The database enforces the same rules. */
export function useTeamPanel(): TeamPanelApi {
  const team = useTeam()
  const current = useCurrentStaff()
  const confirm = useConfirm()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const members = useMemo(() => sortMembers(team), [team])

  const apply = useCallback(
    async (member: StaffMember, patch: StaffAccessPatch, done: string) => {
      const refusal = accessChangeError(team, current, member.id, patch)
      if (refusal) {
        toast({ message: refusal, tone: 'error' })
        return
      }
      setBusy(true)
      try {
        await teamService.updateAccess(member.id, patch)
        await refreshTeamQuietly()
        toast({ message: done, tone: 'success' })
      } catch (error) {
        toast({ message: error instanceof Error ? error.message : 'No se ha podido guardar.', tone: 'error' })
      } finally {
        setBusy(false)
      }
    },
    [current, team, toast],
  )

  const changeActive = async (member: StaffMember, active: boolean) => {
    if (!active) {
      const ok = await confirm({
        title: `¿Desactivar a ${member.name}?`,
        description: 'Dejará de poder entrar. Sus notas se conservan y puedes devolverle el acceso cuando quieras.',
        confirmLabel: 'Desactivar',
        danger: true,
      })
      if (!ok) return
    }
    await apply(member, { active }, active ? `${member.name} puede volver a entrar` : `${member.name} ya no puede entrar`)
  }

  return {
    members,
    currentId: current?.id ?? null,
    busy,
    changeRole: (member, role) => void apply(member, { role }, `${member.name}: ${ROLE_LABELS[role]}`),
    changeActive,
  }
}
