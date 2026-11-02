// CORS and JSON plumbing of the edge functions. Pure web APIs, so it also runs under vitest.

import type { AccountErrorCode } from './accounts.ts'

export const DEFAULT_ALLOWED_ORIGINS = 'http://localhost:5173'

const ERROR_STATUS: Record<AccountErrorCode, number> = {
  invalid_input: 400,
  invalid_credentials: 401,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  own_access: 409,
  last_admin: 409,
  username_taken: 409,
  email_taken: 409,
  name_taken: 409,
  locked: 429,
  failed: 500,
}

export interface HandlerResult {
  status: number
  body: unknown
}

export const ok = (body: unknown): HandlerResult => ({ status: 200, body })
/** Only a code: the web app words it for the coach, and no internal detail ever leaves the function. */
export const fail = (error: AccountErrorCode): HandlerResult => ({ status: ERROR_STATUS[error], body: { error } })

export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw?.trim() ? raw : DEFAULT_ALLOWED_ORIGINS)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export function corsHeaders(origin: string | null, allowed: readonly string[]): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

/** Browser calls from other sites are refused; preflight, method and JSON parsing are handled here. */
export async function serveJson(request: Request, allowed: readonly string[], handle: (body: unknown) => Promise<HandlerResult>): Promise<Response> {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin, allowed)
  const respond = ({ status, body }: HandlerResult) =>
    new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
  if (origin && !allowed.includes(origin)) return respond(fail('forbidden'))
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'POST') return respond(fail('invalid_input'))
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return respond(fail('invalid_input'))
  }
  try {
    return respond(await handle(body))
  } catch {
    return respond(fail('failed'))
  }
}
