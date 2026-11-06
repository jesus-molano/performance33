// Errors in words a member understands (pure). Every failure the screens show goes through errorMessage.

import { bookingErrorMessage, isBookingErrorCode } from '@shared/booking/errors.ts'
import { COPY } from '@/config/copy'

/** An error whose message is already meant for the member. */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}

type LoginErrorCode = keyof typeof COPY.loginErrors

/** The code in an edge function's error body ({ error: 'locked' }), or null. */
export function codeFromBody(body: unknown): string | null {
  const code = typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined
  return typeof code === 'string' ? code : null
}

/** A sign-in refusal: wrong details, too many attempts, or no connection. */
export function loginErrorMessage(code: string | null | undefined): string {
  if (code && code in COPY.loginErrors) return COPY.loginErrors[code as LoginErrorCode]
  return COPY.common.connection
}

/** A database function raised a booking code ('quota_reached'): its message; anything else is a connection problem. */
export function rpcErrorMessage(raised: string | null | undefined): string {
  const code = raised?.trim()
  return isBookingErrorCode(code) ? bookingErrorMessage(code) : COPY.common.connection
}

export function errorMessage(error: unknown): string {
  return error instanceof UserFacingError ? error.message : COPY.common.unknown
}
