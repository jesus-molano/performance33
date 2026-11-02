import { useCallback } from 'react'
import { signOut } from '@/auth'
import { useConfirm, useDisclosure } from '@/hooks'
import { flushDashboardSaves } from '@/persistence'
import { useCurrentProfile } from '@/store'
import type { Profile } from '@/types'

export interface AccountMenuApi {
  profile: Profile | null
  profileOpen: boolean
  openProfile: () => void
  closeProfile: () => void
  signOut: () => Promise<void>
}

/** Header account: 'Mi perfil' and 'Cerrar sesión', which tries to save first and warns if it cannot. */
export function useAccountMenu(): AccountMenuApi {
  const profile = useCurrentProfile()
  const confirm = useConfirm()
  const disclosure = useDisclosure()

  const leave = useCallback(async () => {
    const saved = await flushDashboardSaves()
    if (!saved) {
      const ok = await confirm({
        title: '¿Cerrar sesión sin guardar?',
        description: 'No hay conexión y tienes cambios sin guardar. Si cierras sesión ahora, se perderán.',
        confirmLabel: 'Cerrar sesión',
        danger: true,
      })
      if (!ok) return
    }
    await signOut()
  }, [confirm])

  return { profile, profileOpen: disclosure.isOpen, openProfile: disclosure.open, closeProfile: disclosure.close, signOut: leave }
}
