import type { SupabaseClient } from '@supabase/supabase-js'
import { accountErrorMessage, errorCodeFromBody } from '@/lib/accountMessages'

async function readErrorBody(error: unknown): Promise<unknown> {
  const context = (error as { context?: unknown } | null)?.context
  if (!(context instanceof Response)) return null
  try {
    return await context.clone().json()
  } catch {
    return null
  }
}

/** Calls an edge function. Rejects with a Spanish message. */
export async function invokeFunction<T>(client: SupabaseClient, name: string, body: object): Promise<T> {
  const { data, error } = await client.functions.invoke<T>(name, { body })
  if (error || data === null) throw new Error(accountErrorMessage(errorCodeFromBody(await readErrorBody(error))))
  return data
}
