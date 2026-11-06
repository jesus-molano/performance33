import { describe, expect, it } from 'vitest'
import { COPY } from '@/config/copy'
import { codeFromBody, errorMessage, loginErrorMessage, rpcErrorMessage, UserFacingError } from './errors'

describe('errors', () => {
  it('turns raised booking codes into their message, anything else into a connection problem', () => {
    expect(rpcErrorMessage('quota_reached')).toBe('Ya has usado tus clases de esta semana.')
    expect(rpcErrorMessage('fetch failed')).toBe(COPY.common.connection)
    expect(rpcErrorMessage(undefined)).toBe(COPY.common.connection)
  })

  it('words the sign-in refusals', () => {
    expect(loginErrorMessage(codeFromBody({ error: 'locked' }))).toBe(COPY.loginErrors.locked)
    expect(loginErrorMessage('invalid_credentials')).toBe(COPY.loginErrors.invalid_credentials)
    expect(loginErrorMessage(codeFromBody('nope'))).toBe(COPY.common.connection)
  })

  it('only shows messages meant for the member', () => {
    expect(errorMessage(new UserFacingError('Hola'))).toBe('Hola')
    expect(errorMessage(new Error('TypeError: x is undefined'))).toBe(COPY.common.unknown)
  })
})
