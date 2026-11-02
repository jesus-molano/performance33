import { useCallback } from 'react'
import { auth } from '@/auth'
import { useDisclosure, useToast, type Disclosure } from '@/hooks'
import { useNewPasswordForm, type NewPasswordFormApi } from '@/features/auth/hooks/useNewPasswordForm'
import { TEAM_COPY } from '@/features/team/config'

export interface ChangePasswordApi {
  section: Disclosure
  form: NewPasswordFormApi
}

/** 'Mi perfil' → 'Cambiar mi contraseña': a collapsible section with its own form. */
export function useChangePassword(): ChangePasswordApi {
  const section = useDisclosure()
  const { toast } = useToast()
  const { close } = section
  const save = useCallback(
    async (password: string) => {
      await auth.changePassword(password)
      toast({ message: TEAM_COPY.passwordChanged, tone: 'success' })
      close()
    },
    [close, toast],
  )
  return { section, form: useNewPasswordForm(save) }
}
