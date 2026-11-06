// The member-accounts codes in words for a coach (pure). Anything not about the app account is worded as the team's.

import { accountErrorMessage } from '@/lib/accountMessages'
import type { AccountErrorCode } from '@/lib/accountRules'

const MEMBER_MESSAGES: Partial<Record<AccountErrorCode, string>> = {
  username_taken: 'Ese nombre de usuario ya existe. Prueba con otro.',
  email_taken: 'Ese email ya tiene una cuenta.',
  not_found: 'Este usuario ya no tiene acceso a la app. Recarga la página.',
  unauthorized: 'Tu sesión ha caducado. Vuelve a entrar.',
}

export const memberErrorMessage = (code: AccountErrorCode): string => MEMBER_MESSAGES[code] ?? accountErrorMessage(code)
