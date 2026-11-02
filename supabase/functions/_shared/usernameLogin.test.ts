import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleUsernameLogin, type LoginBackend } from './usernameLogin.ts'

const TOKENS = { access_token: 'a', refresh_token: 'r', user: { email: 'secreto@gym.es' } }
const CLIENT = 'hash-ip'

describe('handleUsernameLogin', () => {
  let backend: LoginBackend

  beforeEach(() => {
    backend = {
      reserveAttempt: vi.fn(async () => true),
      releaseAttempt: vi.fn(async () => undefined),
      clearFailures: vi.fn(async () => undefined),
      emailOf: vi.fn(async (username: string) => (username === 'ana' ? 'secreto@gym.es' : null)),
      signIn: vi.fn(async (_email: string, password: string) => (password === 'buena' ? TOKENS : null)),
    }
  })

  it('returns the session and nothing else, so the email stays hidden', async () => {
    const result = await handleUsernameLogin({ username: ' ANA ', password: 'buena' }, CLIENT, backend)
    expect(result).toEqual({ status: 200, body: { session: { access_token: 'a', refresh_token: 'r' } } })
    expect(JSON.stringify(result)).not.toContain('secreto')
    expect(backend.clearFailures).toHaveBeenCalledWith('ana', CLIENT)
  })

  it('answers the same to an unknown person and a wrong password, and counts both', async () => {
    const unknown = await handleUsernameLogin({ username: 'nadie', password: 'x' }, CLIENT, backend)
    const wrong = await handleUsernameLogin({ username: 'ana', password: 'mala' }, CLIENT, backend)
    expect(unknown).toEqual(wrong)
    expect(wrong).toEqual({ status: 401, body: { error: 'invalid_credentials' } })
    expect(backend.reserveAttempt).toHaveBeenCalledWith('nadie', CLIENT)
    expect(backend.reserveAttempt).toHaveBeenCalledWith('ana', CLIENT)
    expect(backend.clearFailures).not.toHaveBeenCalled()
  })

  it('over a limit it does not even try', async () => {
    vi.mocked(backend.reserveAttempt).mockResolvedValue(false)
    expect(await handleUsernameLogin({ username: 'ana', password: 'buena' }, CLIENT, backend)).toEqual({ status: 429, body: { error: 'locked' } })
    expect(backend.signIn).not.toHaveBeenCalled()
  })

  it('counts each attempt before checking the password, so parallel requests cannot slip through', async () => {
    let allowed = 5
    vi.mocked(backend.reserveAttempt).mockImplementation(async () => allowed-- > 0)
    const results = await Promise.all(Array.from({ length: 200 }, () => handleUsernameLogin({ username: 'ana', password: 'mala' }, CLIENT, backend)))
    expect(backend.signIn).toHaveBeenCalledTimes(5)
    expect(results.filter((result) => result.status === 429)).toHaveLength(195)
  })

  it('malformed input is just a wrong login', async () => {
    for (const body of [null, {}, { username: 'ana' }, { username: 'a b', password: 'x' }, { username: 1, password: 2 }]) {
      expect((await handleUsernameLogin(body, CLIENT, backend)).status).toBe(401)
    }
    expect(backend.reserveAttempt).not.toHaveBeenCalled()
  })

  it('a server problem does not count as a failed attempt', async () => {
    vi.mocked(backend.signIn).mockRejectedValue(new Error('down'))
    await expect(handleUsernameLogin({ username: 'ana', password: 'x' }, CLIENT, backend)).rejects.toThrow('down')
    expect(backend.releaseAttempt).toHaveBeenCalledWith('ana', CLIENT)
  })
})
