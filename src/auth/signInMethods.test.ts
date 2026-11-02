import { describe, expect, it } from 'vitest'
import { signInMethodsFrom } from './signInMethods'

describe('signInMethodsFrom', () => {
  it('offers to connect Google when it is not there', () => {
    expect(signInMethodsFrom(['email'])).toEqual({ google: false, canDisconnectGoogle: false })
  })

  it('allows disconnecting Google only while another way in remains', () => {
    expect(signInMethodsFrom(['email', 'google'])).toEqual({ google: true, canDisconnectGoogle: true })
    expect(signInMethodsFrom(['google'])).toEqual({ google: true, canDisconnectGoogle: false })
  })
})
