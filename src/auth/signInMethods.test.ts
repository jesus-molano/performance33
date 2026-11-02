import { describe, expect, it } from 'vitest'
import { signInMethodsFrom } from './signInMethods'

describe('signInMethodsFrom', () => {
  it('offers to connect Google when it is not there', () => {
    expect(signInMethodsFrom(['email'], true)).toEqual({ google: false, canDisconnectGoogle: false })
  })

  it('allows disconnecting Google only while another way in remains', () => {
    expect(signInMethodsFrom(['email', 'google'], true)).toEqual({ google: true, canDisconnectGoogle: true })
    expect(signInMethodsFrom(['google'], true)).toEqual({ google: true, canDisconnectGoogle: false })
  })

  it('a temporary password nobody remembers does not count as another way in', () => {
    expect(signInMethodsFrom(['email', 'google'], false)).toEqual({ google: true, canDisconnectGoogle: false })
  })
})
