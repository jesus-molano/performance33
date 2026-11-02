import { useCallback, useState } from 'react'
import { auth, finishPasswordChange } from '@/auth'
import { useDisclosure, useToast, type Disclosure } from '@/hooks'
import { useNewPasswordForm, type NewPasswordFormApi } from '@/features/auth/hooks/useNewPasswordForm'
import { TEAM_COPY } from '@/features/team/config'

export interface ChangePasswordApi {
  section: Disclosure
  form: NewPasswordFormApi
  currentPassword: string
  setCurrentPassword: (password: string) => void
}

/**
 * 'Mi perfil' → 'Cambiar mi contraseña': a collapsible section with its own form. Asks for the current one, so nobody
 * at a device left signed in can take the account. Someone who enters with Google and never had their own has none to give.
 */
export function useChangePassword(hasOwnPassword: boolean): ChangePasswordApi {
  const section = useDisclosure()
  const { toast } = useToast()
  const { close } = section
  const [currentPassword, setCurrentPassword] = useState('')
  const save = useCallback(
    async (password: string) => {
      if (hasOwnPassword && !(await auth.verifyPassword(currentPassword))) throw new Error(TEAM_COPY.currentPasswordWrong)
      await auth.changePassword(password)
      if (!hasOwnPassword) await finishPasswordChange()
      setCurrentPassword('')
      toast({ message: TEAM_COPY.passwordChanged, tone: 'success' })
      close()
    },
    [close, currentPassword, hasOwnPassword, toast],
  )
  return { section, form: useNewPasswordForm(save), currentPassword, setCurrentPassword }
}
