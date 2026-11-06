import { describe, expect, it } from 'vitest'
import { giveAccessErrors, giveAccessInput, suggestedUsername } from './giveAccess'

describe('giving the app', () => {
  it('suggests the username the server tries first', () => {
    expect(suggestedUsername('Lucía Pérez')).toBe('lucia.perez')
  })

  it('an unchanged suggestion is left to the server, which numbers it if taken', () => {
    expect(giveAccessInput({ username: 'lucia.perez', email: '', usernameEdited: false })).toEqual({ username: null, email: null })
    expect(giveAccessInput({ username: ' Lucia.P ', email: ' Lucia@Gym.es ', usernameEdited: true })).toEqual({ username: 'lucia.p', email: 'lucia@gym.es' })
  })

  it('checks what the coach typed', () => {
    expect(giveAccessErrors({ username: 'x', email: '', usernameEdited: true })).toEqual({ username: 'invalid' })
    expect(giveAccessErrors({ username: 'x', email: 'no-es-un-email', usernameEdited: false })).toEqual({ email: 'invalid' })
    expect(giveAccessErrors({ username: 'lucia', email: '', usernameEdited: true })).toEqual({})
  })
})
