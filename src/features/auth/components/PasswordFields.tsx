import { Input } from '@/components/ui'
import { PASSWORD_STRENGTH_LABELS } from '@/features/auth/config'
import type { NewPasswordFormApi } from '@/features/auth/hooks/useNewPasswordForm'

export interface PasswordFieldsProps {
  form: Pick<NewPasswordFormApi, 'password' | 'setPassword' | 'repeated' | 'setRepeated' | 'strength'>
  autoFocus?: boolean
}

/** New password with its strength hint, and the confirmation. */
export function PasswordFields({ form, autoFocus = false }: PasswordFieldsProps) {
  return (
    <>
      <Input
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        value={form.password}
        hint={PASSWORD_STRENGTH_LABELS[form.strength] || undefined}
        onChange={(event) => form.setPassword(event.target.value)}
        autoFocus={autoFocus}
        nativeUndo
      />
      <Input
        label="Repite la contraseña"
        type="password"
        autoComplete="new-password"
        value={form.repeated}
        onChange={(event) => form.setRepeated(event.target.value)}
        nativeUndo
      />
    </>
  )
}
