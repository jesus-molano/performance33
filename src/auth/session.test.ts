import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '@/store/sessionStore'
import type { Profile } from '@/types'
import { auth, teamService } from './instance'
import { retrySession } from './session'

vi.mock('./instance', () => ({
  auth: { getUser: vi.fn() },
  teamService: { getOwnProfile: vi.fn() },
}))

const PROFILE: Profile = { id: 's1', username: 'ana', email: 'ana@p33.test', name: 'Ana', color: '#000000', role: 'monitor', active: true, mustChangePassword: false, hasOwnPassword: true, temporaryPasswordExpired: false, googleConnected: false }
const USER = { id: 'u1', email: 'ana@p33.test' }

describe('retrySession', () => {
  beforeEach(() => {
    vi.mocked(auth.getUser).mockReset()
    vi.mocked(teamService.getOwnProfile).mockReset()
    useSessionStore.setState({ status: 'loading', userId: null, email: null, profile: null, team: [] })
  })

  it('does not sign out a working session when the check fails without connection', async () => {
    useSessionStore.setState({ status: 'ready', userId: USER.id, email: USER.email, profile: PROFILE, team: [PROFILE] })
    vi.mocked(auth.getUser).mockRejectedValue(new Error('Failed to fetch'))
    await retrySession()
    expect(useSessionStore.getState()).toMatchObject({ status: 'ready', profile: PROFILE, team: [PROFILE] })
  })

  it('says offline on a cold start without connection, not signed out', async () => {
    vi.mocked(auth.getUser).mockRejectedValue(new Error('Failed to fetch'))
    await retrySession()
    expect(useSessionStore.getState().status).toBe('offline')
  })

  it('leaves when there really is no session', async () => {
    useSessionStore.setState({ status: 'ready', userId: USER.id, email: USER.email, profile: PROFILE, team: [PROFILE] })
    vi.mocked(auth.getUser).mockResolvedValue(null)
    await retrySession()
    expect(useSessionStore.getState()).toMatchObject({ status: 'signed-out', userId: null, email: null, profile: null, team: [] })
  })

  it('keeps the email of an account without access, to show which one it was', async () => {
    vi.mocked(auth.getUser).mockResolvedValue(USER)
    vi.mocked(teamService.getOwnProfile).mockResolvedValue(null)
    await retrySession()
    expect(useSessionStore.getState()).toMatchObject({ status: 'no-access', email: USER.email })
  })

  it('stops at the password screen while it has to be changed', async () => {
    vi.mocked(auth.getUser).mockResolvedValue(USER)
    vi.mocked(teamService.getOwnProfile).mockResolvedValue({ ...PROFILE, mustChangePassword: true })
    await retrySession()
    expect(useSessionStore.getState().status).toBe('must-change-password')
  })

  it('a reset password interrupts a working session the next time it checks', async () => {
    useSessionStore.setState({ status: 'ready', userId: USER.id, email: USER.email, profile: PROFILE, team: [PROFILE] })
    vi.mocked(auth.getUser).mockResolvedValue(USER)
    vi.mocked(teamService.getOwnProfile).mockResolvedValue({ ...PROFILE, mustChangePassword: true })
    await retrySession()
    expect(useSessionStore.getState().status).toBe('must-change-password')
  })
})
