import { auth, finishPasswordChange } from '@/auth'
import { SamePasswordError } from '@/auth/messages'
import { useNewPasswordForm, type NewPasswordFormApi } from './useNewPasswordForm'

/** A retry after a half-done attempt asks for the password already saved: the server decides whether it is valid. */
async function replaceTemporaryPassword(password: string): Promise<void> {
  try {
    await auth.changePassword(password)
  } catch (error) {
    if (!(error instanceof SamePasswordError)) throw error
  }
  await finishPasswordChange()
}

/** First login: the temporary password is replaced, then into the app. */
export function useCreatePassword(): NewPasswordFormApi {
  return useNewPasswordForm(replaceTemporaryPassword)
}
