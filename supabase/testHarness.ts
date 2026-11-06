// What the PGlite tests of schema.sql share: stand-ins for what Supabase provides (auth schema, roles, realtime) and
// how to act as each kind of user. No Node imports, so tests under src/ can use it too (they read the schema with ?raw).

import type { PGlite } from '@electric-sql/pglite'

/** Booting Postgres in WASM takes seconds, far more while the whole suite runs in parallel. */
export const PGLITE_TIMEOUT_MS = 60_000

export const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema auth, public to anon, authenticated, service_role;
  create table auth.users (id uuid primary key, email text, encrypted_password text);
  create table auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users (id) on delete cascade);
  create table auth.refresh_tokens (id bigserial primary key, user_id varchar(255));
  create table auth.identities (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users (id) on delete cascade, provider text, identity_data jsonb);
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt() ->> 'sub')::uuid $$;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  create publication supabase_realtime;
  create schema realtime;
  create table realtime.messages (id bigserial primary key, topic text not null, extension text not null, payload jsonb);
  alter table realtime.messages enable row level security;
  create function realtime.topic() returns text language sql stable as
    $$ select nullif(current_setting('realtime.topic', true), '') $$;
  grant usage on schema realtime to anon, authenticated;
  grant select, insert on realtime.messages to anon, authenticated;
  grant usage on sequence realtime.messages_id_seq to anon, authenticated;
`

export const PASSWORD_AMR = [{ method: 'password', timestamp: 1 }]

export interface SqlSession {
  asSuperuser(): Promise<void>
  /** Signed in as that auth user, through the API (role authenticated). */
  asPerson(id: string, amr?: unknown): Promise<void>
  asAnon(): Promise<void>
  /** The edge functions' service key. */
  asService(): Promise<void>
  rows<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>
  count(table: string): Promise<number>
  affected(sql: string, params?: unknown[]): Promise<number>
}

/** Helpers over the database `getDb` returns when called (it may be created later, in a beforeAll). */
export function sqlSession(getDb: () => PGlite): SqlSession {
  const rows = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> => (await getDb().query<T>(sql, params)).rows
  return {
    async asSuperuser() {
      await getDb().exec(`reset role; select set_config('request.jwt.claims', '', false);`)
    },
    async asPerson(id, amr = PASSWORD_AMR) {
      await getDb().exec('reset role')
      await getDb().query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: id, amr })])
      await getDb().exec('set role authenticated')
    },
    async asAnon() {
      await getDb().exec(`reset role; select set_config('request.jwt.claims', '', false); set role anon;`)
    },
    async asService() {
      await getDb().exec(`reset role; select set_config('request.jwt.claims', '', false); set role service_role;`)
    },
    rows,
    async count(table) {
      return (await rows<{ n: number }>(`select count(*)::int as n from public.${table}`))[0].n
    },
    async affected(sql, params = []) {
      return (await getDb().query(sql, params)).affectedRows ?? 0
    },
  }
}
