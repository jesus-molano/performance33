import { describe, expect, it } from 'vitest'
import { autoFullscreenState, queryAutoFullscreen, type PermissionStatusLike } from './autoFullscreen'

const status = (state: PermissionState): PermissionStatusLike => Object.assign(new EventTarget(), { state })

describe('queryAutoFullscreen', () => {
  it('asks for fullscreen without a gesture', async () => {
    let asked: unknown = null
    const result = await queryAutoFullscreen((descriptor) => {
      asked = descriptor
      return Promise.resolve(status('granted'))
    })
    expect(asked).toEqual({ name: 'fullscreen', allowWithoutGesture: true })
    expect(autoFullscreenState(result)).toBe('granted')
  })

  it('is unsupported where the browser rejects the question or has no Permissions API', async () => {
    expect(autoFullscreenState(await queryAutoFullscreen(() => Promise.reject(new TypeError('bad name'))))).toBe('unsupported')
    expect(autoFullscreenState(await queryAutoFullscreen(() => {
      throw new TypeError('sync')
    }))).toBe('unsupported')
    expect(autoFullscreenState(await queryAutoFullscreen(undefined))).toBe('unsupported')
  })

  it('is off without the policy (prompt or denied)', () => {
    expect(autoFullscreenState(status('prompt'))).toBe('off')
    expect(autoFullscreenState(status('denied'))).toBe('off')
  })
})
