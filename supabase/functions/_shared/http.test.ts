import { describe, expect, it } from 'vitest'
import { corsHeaders, ok, parseAllowedOrigins, serveJson } from './http.ts'

const ALLOWED = ['https://app.test']
const post = (body: string, origin?: string) =>
  new Request('https://fn.test', { method: 'POST', body, headers: origin ? { origin } : {} })

describe('parseAllowedOrigins', () => {
  it('defaults to localhost and accepts a list', () => {
    expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:5173'])
    expect(parseAllowedOrigins(' https://a.test/, https://b.test ')).toEqual(['https://a.test', 'https://b.test'])
  })
})

describe('corsHeaders', () => {
  it('only names allowed origins', () => {
    expect(corsHeaders('https://app.test', ALLOWED)['Access-Control-Allow-Origin']).toBe('https://app.test')
    expect(corsHeaders('https://evil.test', ALLOWED)).not.toHaveProperty('Access-Control-Allow-Origin')
  })
})

describe('serveJson', () => {
  const echo = async (body: unknown) => ok(body)

  it('answers the browser preflight', async () => {
    const response = await serveJson(new Request('https://fn.test', { method: 'OPTIONS', headers: { origin: 'https://app.test' } }), ALLOWED, echo)
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('https://app.test')
  })

  it('refuses other sites and never runs the handler for them', async () => {
    let ran = false
    const response = await serveJson(post('{}', 'https://evil.test'), ALLOWED, async () => {
      ran = true
      return ok({})
    })
    expect(response.status).toBe(403)
    expect(ran).toBe(false)
  })

  it('refuses bad JSON and other methods', async () => {
    expect((await serveJson(post('no es json'), ALLOWED, echo)).status).toBe(400)
    expect((await serveJson(new Request('https://fn.test'), ALLOWED, echo)).status).toBe(400)
  })

  it('never lets an internal error out', async () => {
    const response = await serveJson(post('{}'), ALLOWED, () => Promise.reject(new Error('secreto')))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'failed' })
  })
})
