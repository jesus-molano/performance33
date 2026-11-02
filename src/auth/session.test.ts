import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '@/store/sessionStore'
import { auth, teamService } from './instance'
import { retrySession } from './session'

vi.mock('./instance', () => ({
  auth: { getUser: vi.fn() },
  teamService: { claimProfile: vi.fn() },
}))

const STAFF = { id: 's1', email: 'ana@p33.test', name: 'Ana', color: '#000000', role: 'monitor', active: true } as const
const USER = { id: 'u1', email: 'ana@p33.test' }

describe('retrySession', () => {
  beforeEach(() => {
    vi.mocked(auth.getUser).mockReset()
    vi.mocked(teamService.claimProfile).mockReset()
    useSessionStore.setState({ status: 'loading', userId: null, email: null, staff: null, team: [] })
  })

  it('does not sign out a working session when the check fails without connection', async () => {
    useSessionStore.setState({ status: 'ready', userId: USER.id, email: USER.email, staff: STAFF, team: [STAFF] })
    vi.mocked(auth.getUser).mockRejectedValue(new Error('Failed to fetch'))
    await retrySession()
    expect(useSessionStore.getState()).toMatchObject({ status: 'ready', staff: STAFF, team: [STAFF] })
  })

  it('says offline on a cold start without connection, not signed out', async () => {
    vi.mocked(auth.getUser).mockRejectedValue(new Error('Failed to fetch'))
    await retrySession()
    expect(useSessionStore.getState().status).toBe('offline')
  })

  it('leaves when there really is no session', async () => {
    useSessionStore.setState({ status: 'ready', userId: USER.id, email: USER.email, staff: STAFF, team: [STAFF] })
    vi.mocked(auth.getUser).mockResolvedValue(null)
    await retrySession()
    expect(useSessionStore.getState()).toMatchObject({ status: 'signed-out', userId: null, email: null, staff: null, team: [] })
  })

  it('keeps the email of an account without access, to show which one it was', async () => {
    vi.mocked(auth.getUser).mockResolvedValue(USER)
    vi.mocked(teamService.claimProfile).mockResolvedValue(null)
    await retrySession()
    expect(useSessionStore.getState()).toMatchObject({ status: 'no-access', email: USER.email })
  })
})
