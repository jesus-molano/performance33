import { useCallback, useState } from 'react'
import { refreshTeamQuietly, teamService } from '@/auth'
import { useConfirm, useToast } from '@/hooks'
import type { AccessChange } from '@/lib/accountRules'
import { accessChangeError } from '@/lib/ownership'
import { useCurrentProfile } from '@/store'
import type { Profile, ProfileRole } from '@/types'
import { ROLE_LABELS, TEAM_COPY } from '@/features/team/config'
import { useTeamAccounts } from './useTeamAccounts'

export interface TemporaryPassword {
  name: string
  username: string
  password: string
}

export interface TeamPanelApi {
  accounts: Profile[]
  loadFailed: boolean
  currentId: string | null
  busy: boolean
  /** The password to show once; null when there is none. */
  temporary: TemporaryPassword | null
  showTemporary: (temporary: TemporaryPassword) => void
  closeTemporary: () => void
  changeRole: (account: Profile, role: ProfileRole) => void
  changeActive: (account: Profile, active: boolean) => Promise<void>
  resetPassword: (account: Profile) => Promise<void>
  remove: (account: Profile) => Promise<void>
}

/** Ajustes → Equipo: what an administrator can do to an account. The server enforces the same rules. */
export function useTeamPanel(): TeamPanelApi {
  const { accounts, loadFailed } = useTeamAccounts()
  const current = useCurrentProfile()
  const confirm = useConfirm()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [temporary, setTemporary] = useState<TemporaryPassword | null>(null)

  const apply = useCallback(
    async (account: Profile, change: AccessChange, action: () => Promise<void>) => {
      const refusal = accessChangeError(accounts, current, account.id, change)
      if (refusal) {
        toast({ message: refusal, tone: 'error' })
        return
      }
      setBusy(true)
      try {
        await action()
        await refreshTeamQuietly()
      } catch (error) {
        toast({ message: error instanceof Error ? error.message : TEAM_COPY.saveFailed, tone: 'error' })
      } finally {
        setBusy(false)
      }
    },
    [accounts, current, toast],
  )

  const changeRole = (account: Profile, role: ProfileRole) =>
    void apply(account, { role }, async () => {
      await teamService.setRole(account.id, role)
      toast({ message: `${account.name}: ${ROLE_LABELS[role]}`, tone: 'success' })
    })

  const changeActive = async (account: Profile, active: boolean) => {
    if (!active) {
      const ok = await confirm({
        title: `¿Desactivar a ${account.name}?`,
        description: 'Dejará de poder entrar y se cerrarán sus sesiones. Sus notas se conservan y puedes devolverle el acceso cuando quieras.',
        confirmLabel: 'Desactivar',
        danger: true,
      })
      if (!ok) return
    }
    await apply(account, { active }, async () => {
      await teamService.setActive(account.id, active)
      toast({ message: active ? `${account.name} puede volver a entrar` : `${account.name} ya no puede entrar`, tone: 'success' })
    })
  }

  const resetPassword = async (account: Profile) => {
    const ok = await confirm({
      title: `¿Dar una contraseña nueva a ${account.name}?`,
      description: 'La que tiene dejará de funcionar y se cerrarán sus sesiones. La primera vez que entre tendrá que elegir una suya.',
      confirmLabel: 'Crear contraseña',
    })
    if (!ok) return
    await apply(account, { resetPassword: true }, async () => {
      const password = await teamService.resetPassword(account.id)
      setTemporary({ name: account.name, username: account.username, password })
    })
  }

  const remove = async (account: Profile) => {
    const ok = await confirm({
      title: `¿Eliminar a ${account.name}?`,
      description: 'Su cuenta se borra para siempre. Sus notas se conservan, pero sin firma. Si solo deja de venir por un tiempo, mejor desactívala.',
      confirmLabel: 'Eliminar cuenta',
      danger: true,
    })
    if (!ok) return
    await apply(account, { remove: true }, async () => {
      await teamService.deleteAccount(account.id)
      toast({ message: `${account.name} ya no está en el equipo`, tone: 'success' })
    })
  }

  return {
    accounts,
    loadFailed,
    currentId: current?.id ?? null,
    busy,
    temporary,
    showTemporary: setTemporary,
    closeTemporary: () => setTemporary(null),
    changeRole,
    changeActive,
    resetPassword,
    remove,
  }
}
