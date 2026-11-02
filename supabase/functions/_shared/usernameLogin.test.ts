import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleUsernameLogin, type LoginBackend } from './usernameLogin.ts'

const TOKENS = { access_token: 'a', refresh_token: 'r', user: { email: 'secreto@gym.es' } }

describe('handleUsernameLogin', () => {
  let backend: LoginBackend

  beforeEach(() => {
    backend = {
      isLocked: vi.fn(async () => false),
      recordFailure: vi.fn(async () => undefined),
      clearFailures: vi.fn(async () => undefined),
      emailOf: vi.fn(async (username: string) => (username === 'ana' ? 'secreto@gym.es' : null)),
      signIn: vi.fn(async (_email: string, password: string) => (password === 'buena' ? TOKENS : null)),
    }
  })

  it('returns the session and nothing else, so the email stays hidden', async () => {
    const result = await handleUsernameLogin({ username: ' ANA ', password: 'buena' }, backend)
    expect(result).toEqual({ status: 200, body: { session: { access_token: 'a', refresh_token: 'r' } } })
    expect(JSON.stringify(result)).not.toContain('secreto')
    expect(backend.clearFailures).toHaveBeenCalledWith('ana')
  })

  it('answers the same to an unknown person and a wrong password, and counts both', async () => {
    const unknown = await handleUsernameLogin({ username: 'nadie', password: 'x' }, backend)
    const wrong = await handleUsernameLogin({ username: 'ana', password: 'mala' }, backend)
    expect(unknown).toEqual(wrong)
    expect(wrong).toEqual({ status: 401, body: { error: 'invalid_credentials' } })
    expect(backend.recordFailure).toHaveBeenCalledWith('nadie')
    expect(backend.recordFailure).toHaveBeenCalledWith('ana')
  })

  it('a locked username does not even try', async () => {
    vi.mocked(backend.isLocked).mockResolvedValue(true)
    expect(await handleUsernameLogin({ username: 'ana', password: 'buena' }, backend)).toEqual({ status: 429, body: { error: 'locked' } })
    expect(backend.signIn).not.toHaveBeenCalled()
  })

  it('malformed input is just a wrong login', async () => {
    for (const body of [null, {}, { username: 'ana' }, { username: 'a b', password: 'x' }, { username: 1, password: 2 }]) {
      expect((await handleUsernameLogin(body, backend)).status).toBe(401)
    }
    expect(backend.recordFailure).not.toHaveBeenCalled()
  })

  it('a server problem does not count as a failed attempt', async () => {
    vi.mocked(backend.signIn).mockRejectedValue(new Error('down'))
    await expect(handleUsernameLogin({ username: 'ana', password: 'x' }, backend)).rejects.toThrow()
    expect(backend.recordFailure).not.toHaveBeenCalled()
  })
})
