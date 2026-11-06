// Runs schema.sql on a real Postgres (PGlite) with stand-ins for what Supabase provides
// (auth schema, roles, realtime publication) and checks the access rules as each kind of user.

import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TV_MAX_SCREENS, TV_MAX_SECTIONS, TV_MIN_SECTIONS, TV_SCREEN_NAME_MAX_LENGTH } from '../src/config/app.ts'

// Booting Postgres in WASM takes seconds, far more while the whole suite runs in parallel.
const PGLITE_TIMEOUT_MS = 60_000
vi.setConfig({ testTimeout: PGLITE_TIMEOUT_MS, hookTimeout: PGLITE_TIMEOUT_MS })

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
/** The schema the live project had before the TV screens (commit a094f9a): this file is run over it there. */
const PREVIOUS_SCHEMA = readFileSync(new URL('./fixtures/schema.previous.sql', import.meta.url), 'utf8')

const SUPABASE_STUBS = `
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

const ID = {
  admin: '00000000-0000-4000-8000-000000000001',
  ana: '00000000-0000-4000-8000-000000000002',
  ben: '00000000-0000-4000-8000-000000000003',
  stranger: '00000000-0000-4000-8000-000000000004',
  newbie: '00000000-0000-4000-8000-000000000005',
  former: '00000000-0000-4000-8000-000000000006',
}

const ADMIN = ID.admin
const ANA = ID.ana
const BEN = ID.ben
const STRANGER = ID.stranger
const NEWBIE = ID.newbie
const FORMER = ID.former

const PASSWORD_AMR = [{ method: 'password', timestamp: 1 }]
const GOOGLE_AMR = [{ method: 'oauth', timestamp: 1 }]

let db: PGlite

async function asSuperuser(): Promise<void> {
  await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`)
}

async function asPerson(id: string, amr: unknown = PASSWORD_AMR): Promise<void> {
  await db.exec('reset role')
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: id, amr })])
  await db.exec('set role authenticated')
}

async function asAnon(): Promise<void> {
  await db.exec(`reset role; select set_config('request.jwt.claims', '', false); set role anon;`)
}

async function asService(): Promise<void> {
  await db.exec(`reset role; select set_config('request.jwt.claims', '', false); set role service_role;`)
}

async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(sql, params)).rows
}

async function count(table: string): Promise<number> {
  return (await rows<{ n: number }>(`select count(*)::int as n from public.${table}`))[0].n
}

async function affected(sql: string, params: unknown[] = []): Promise<number> {
  return (await db.query(sql, params)).affectedRows ?? 0
}

const profileId = async (username: string): Promise<string> => {
  await asSuperuser()
  return (await rows<{ id: string }>('select id from public.profiles where username = $1', [username]))[0].id
}

const setPassword = (user: string, hash: string) => db.exec(`update auth.users set encrypted_password = '${hash}' where id = '${user}'`)

const connectGoogle = (user: string, email: string) =>
  db.query(`insert into auth.identities (user_id, provider, identity_data) values ($1, 'google', $2)`, [user, JSON.stringify({ email })])

async function seedPeople(): Promise<void> {
  await asSuperuser()
  await db.exec(`
    truncate public.row_history, public.profiles, public.login_attempts, public.clients, public.programs, public.library_exercises, public.notes, public.settings, public.screens, public.screen_sections cascade;
    delete from auth.users;
    delete from auth.refresh_tokens;
    delete from auth.identities;
    insert into auth.users (id, email, encrypted_password) values
      ('${ID.admin}', 'admin@p33.test', 'hash-admin'),
      ('${ID.ana}', 'ana@p33.test', 'hash-ana'),
      ('${ID.ben}', 'ben@accounts.invalid', 'hash-ben'),
      ('${ID.stranger}', 'stranger@p33.test', 'hash-stranger'),
      ('${ID.newbie}', 'newbie@accounts.invalid', 'hash-temporal'),
      ('${ID.former}', 'former@p33.test', 'hash-former');
    insert into public.profiles (user_id, username, email, name, role, must_change_password) values
      ('${ID.admin}', 'admin', 'admin@p33.test', 'Admin', 'admin', false),
      ('${ID.ana}', 'ana', 'ana@p33.test', 'Ana', 'monitor', false),
      ('${ID.ben}', 'ben', null, 'Ben', 'monitor', false),
      ('${ID.newbie}', 'newbie', 'newbie@p33.test', 'Novata', 'monitor', true),
      ('${ID.former}', 'former', 'former@p33.test', 'Antigua', 'monitor', false);
    update public.profiles set active = false where username = 'former';
    insert into public.clients (id, data) values ('c1', '{"firstName":"Laura"}');
    insert into public.programs (id, data) values ('p1', '{"clientId":"c1"}');
    insert into public.library_exercises (id, data) values ('l1', '{"name":"Remo"}');
    insert into public.settings (id, data) values ('main', '{"gymName":"P33"}');
    insert into public.screens (id, data) values ('1', '{"name":"Pantalla 1","sections":3}');
    insert into public.screen_sections (id, screen_id, data) values ('1:1', '1', '{"clientId":"c1","day":2,"assignedAt":"2026-11-06T10:00:00.000Z"}');
  `)
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUBS)
  await db.exec(SCHEMA)
})

afterAll(async () => {
  await db.close()
})

beforeEach(seedPeople)

describe('schema.sql', () => {
  it('refuses to run over the previous version instead of leaving a mix', async () => {
    const old = new PGlite()
    await old.exec(SUPABASE_STUBS)
    await old.exec('create table public.staff (id uuid primary key)')
    await expect(old.exec(SCHEMA)).rejects.toThrow(/versión anterior/)
    await old.close()
  })

  it('can run twice without failing', async () => {
    await asSuperuser()
    await expect(db.exec(SCHEMA)).resolves.toBeDefined()
  })

  it('creates no account by itself: the first admin is added on purpose', async () => {
    const fresh = new PGlite()
    await fresh.exec(SUPABASE_STUBS)
    await fresh.exec(SCHEMA)
    const { rows: profiles } = await fresh.query('select 1 from public.profiles')
    await fresh.close()
    expect(profiles).toEqual([])
  })

  it('the bootstrap of the README works, without being asked to change the password', async () => {
    await asSuperuser()
    await db.exec(`
      insert into public.profiles (user_id, username, name, email, role)
      select id, 'jefa', 'Jefa', email, 'admin' from auth.users where email = 'stranger@p33.test';
    `)
    await asPerson(STRANGER)
    expect(await rows('select * from public.my_profile()')).toMatchObject([{ username: 'jefa', role: 'admin', must_change_password: false }])
    expect(await rows('select public.is_admin() as ok')).toEqual([{ ok: true }])
  })

  it('keeps names short, colours as plain hex, and no two people with one name', async () => {
    await asPerson(ANA)
    await expect(rows(`update public.profiles set color = 'url(https://evil.test/x)' where username is not null`)).rejects.toThrow()
    await expect(rows(`update public.profiles set name = repeat('a', 31) where id = public.current_profile_id()`)).rejects.toThrow(/name/)
    await expect(rows(`update public.profiles set name = '   ' where id = public.current_profile_id()`)).rejects.toThrow(/name/)
    for (const lookalike of ['Ad\u200Bmin', 'Admin\u00A0', 'Ad\u202Emin']) {
      await expect(rows('update public.profiles set name = $1 where id = public.current_profile_id()', [lookalike])).rejects.toThrow(/name/)
    }
    await expect(rows(`update public.profiles set name = ' admin ' where id = public.current_profile_id()`)).rejects.toThrow(/profiles_name_unique/)
  })

  it('refuses roles that do not exist and malformed usernames', async () => {
    await asSuperuser()
    await expect(db.exec(`update public.profiles set role = 'jefe' where username = 'ana'`)).rejects.toThrow(/role/)
    await expect(db.exec(`update public.profiles set username = 'con@arroba' where username = 'ana'`)).rejects.toThrow(/username/)
  })

  it('usernames and emails are unique and lower-cased', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set username = '  ANITA ', email = '  ANA@P33.test ' where username = 'ana'`)
    expect(await rows(`select email from public.profiles where username = 'anita'`)).toEqual([{ email: 'ana@p33.test' }])
    await expect(db.exec(`update public.profiles set username = 'anita' where username = 'ben'`)).rejects.toThrow(/username/)
    await expect(db.exec(`update public.profiles set email = 'ana@p33.test' where username = 'ben'`)).rejects.toThrow(/email/)
  })

  it('publishes every table for realtime, but never the login attempts', async () => {
    await asSuperuser()
    const tables = await rows<{ tablename: string }>(
      `select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename`,
    )
    expect(tables.map((t) => t.tablename)).toEqual(['clients', 'library_exercises', 'notes', 'profiles', 'programs', 'screen_sections', 'screens', 'settings'])
  })
})

describe('my_profile', () => {
  it('returns the account of whoever is signed in', async () => {
    await asPerson(ANA)
    expect(await rows('select * from public.my_profile()')).toMatchObject([{ username: 'ana', email: 'ana@p33.test', role: 'monitor' }])
  })

  it('returns nothing for a login with no account, or a deactivated one', async () => {
    await asPerson(STRANGER)
    expect(await rows('select * from public.my_profile()')).toEqual([])
    await asPerson(FORMER)
    expect(await rows('select * from public.my_profile()')).toEqual([])
  })

  it('tells whoever is on a temporary password', async () => {
    await asPerson(NEWBIE)
    expect(await rows('select must_change_password from public.my_profile()')).toEqual([{ must_change_password: true }])
  })

  it('does not ask it of someone who entered with the Google account of their email', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'Newbie@p33.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await rows('select must_change_password from public.my_profile()')).toEqual([{ must_change_password: false }])
    await asPerson(NEWBIE, ['oauth'])
    expect(await rows('select must_change_password from public.my_profile()')).toEqual([{ must_change_password: false }])
  })
})

describe('temporary passwords', () => {
  it('nothing can be read or written until it is changed', async () => {
    await asPerson(NEWBIE)
    for (const table of ['profiles', 'clients', 'programs', 'library_exercises', 'notes', 'settings']) {
      expect(await (table === 'profiles' ? rows('select id from public.profiles') : rows(`select id from public.${table}`))).toEqual([])
    }
    await expect(rows(`insert into public.clients (id, data) values ('x', '{}')`)).rejects.toThrow(/row-level security/)
    expect(await affected(`update public.profiles set name = 'Otro' where true`)).toBe(0)
    expect(await rows('select public.current_profile_id() as id')).toEqual([{ id: null }])
  })

  it('the same account entering with the Google account of its email can read everything', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await count('clients')).toBe(1)
  })

  it('a Google account connected by hand does not skip the step', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'intruso@gmail.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await count('clients')).toBe(0)
    expect(await rows('select must_change_password, google_connected from public.my_profile()')).toEqual([{ must_change_password: true, google_connected: true }])
  })

  it('a password session on the same account gets nothing from Google', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await asPerson(NEWBIE)
    expect(await count('clients')).toBe(0)
  })

  it('a new password removes the Google accounts connected by hand, not the one of the email', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'intruso@gmail.test')
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await connectGoogle(BEN, 'ben@gmail.test')
    await asPerson(ADMIN)
    await expect(rows(`select public.remove_other_google_identities('${NEWBIE}')`)).rejects.toThrow(/permission denied/)
    await asService()
    await rows(`select public.remove_other_google_identities('${NEWBIE}')`)
    await asSuperuser()
    expect(await rows(`select identity_data ->> 'email' as email from auth.identities where user_id = '${NEWBIE}'`)).toEqual([{ email: 'newbie@p33.test' }])
    expect(await rows(`select 1 from auth.identities where user_id = '${BEN}'`)).toHaveLength(1)
  })

  it('caduca a los 3 días: ya no sirve para crear la definitiva', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set temp_password_expires_at = now() - interval '1 minute' where username = 'newbie'`)
    await setPassword(NEWBIE, 'hash-nueva')
    await asPerson(NEWBIE)
    expect(await rows('select temporary_password_expired from public.my_profile()')).toEqual([{ temporary_password_expired: true }])
    await expect(rows('select public.finish_password_change()')).rejects.toThrow(/password_not_changed/)
    expect(await count('clients')).toBe(0)
  })

  it('caducada, quien entra con la cuenta de Google de su email sí puede crear una contraseña', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set temp_password_expires_at = now() - interval '1 minute' where username = 'newbie'`)
    await setPassword(NEWBIE, 'hash-nueva')
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await rows('select has_own_password, temporary_password_expired from public.my_profile()')).toEqual([{ has_own_password: false, temporary_password_expired: false }])
    await rows('select public.finish_password_change()')
    expect(await rows('select has_own_password from public.my_profile()')).toEqual([{ has_own_password: true }])
  })

  it('a new temporary password starts a new period, and the flag going away clears it', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set must_change_password = true where username = 'newbie'`)
    expect(await rows(`select temp_password_expires_at > now() + interval '71 hours' as fresh from public.profiles where username = 'newbie'`)).toEqual([{ fresh: true }])
    await db.exec(`update public.profiles set must_change_password = false where username = 'newbie'`)
    expect(await rows(`select temp_password_expires_at from public.profiles where username = 'newbie'`)).toEqual([{ temp_password_expires_at: null }])
  })

  it('cannot be skipped by just calling the function', async () => {
    await asPerson(NEWBIE)
    await expect(rows('select public.finish_password_change()')).rejects.toThrow(/password_not_changed/)
    expect(await count('clients')).toBe(0)
  })

  it('lifts the flag once the password has really changed', async () => {
    await asSuperuser()
    await setPassword(ID.newbie, 'hash-propia')
    await asPerson(NEWBIE)
    await rows('select public.finish_password_change()')
    expect(await count('clients')).toBe(1)
    await asSuperuser()
    expect(await rows(`select must_change_password, temp_password_hash from public.profiles where username = 'newbie'`)).toEqual([
      { must_change_password: false, temp_password_hash: null },
    ])
  })

  it('a reset remembers the new temporary password, also when it was already pending', async () => {
    await asSuperuser()
    await setPassword(ID.newbie, 'hash-otra-temporal')
    await asService()
    await rows(`update public.profiles set must_change_password = true where username = 'newbie'`)
    await asPerson(NEWBIE)
    await expect(rows('select public.finish_password_change()')).rejects.toThrow(/password_not_changed/)
  })

  it('nobody can read the hash, nor anyone else clear the flag', async () => {
    await asPerson(ANA)
    await expect(rows('select temp_password_hash from public.profiles')).rejects.toThrow(/permission denied/)
    await expect(rows('select must_change_password from public.profiles')).rejects.toThrow(/permission denied/)
    await expect(rows(`update public.profiles set must_change_password = false where true`)).rejects.toThrow(/permission denied/)
  })
})

describe('people without access', () => {
  const TABLES = ['clients', 'programs', 'library_exercises', 'notes', 'settings', 'screens', 'screen_sections']

  for (const [label, enter] of [
    ['a signed-in stranger', () => asPerson(STRANGER)],
    ['a deactivated coach', () => asPerson(FORMER)],
  ] as const) {
    it(`${label} sees nothing and can write nothing`, async () => {
      await enter()
      for (const table of TABLES) expect(await count(table)).toBe(0)
      expect(await rows('select id from public.profiles')).toEqual([])
      await expect(rows(`insert into public.clients (id, data) values ('x', '{}')`)).rejects.toThrow(/row-level security/)
      await expect(rows(`insert into public.settings (id, data) values ('main', '{}')`)).rejects.toThrow(/row-level security/)
      expect(await affected(`update public.clients set data = '{}' where id = 'c1'`)).toBe(0)
      expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(0)
      expect(await rows('select * from public.team_accounts()')).toEqual([])
    })
  }

  it('anonymous visitors have no permissions at all', async () => {
    await asAnon()
    for (const table of [...TABLES, 'login_attempts']) await expect(count(table)).rejects.toThrow(/permission denied/)
    await expect(rows('select id from public.profiles')).rejects.toThrow(/permission denied/)
    await expect(rows('select * from public.my_profile()')).rejects.toThrow(/permission denied/)
    await expect(rows('select * from public.team_accounts()')).rejects.toThrow(/permission denied/)
  })
})

describe('accounts', () => {
  it('the team only sees of each other what signs a note', async () => {
    await asPerson(ANA)
    expect(await rows(`select name, color, role, active from public.profiles where name = 'Ben'`)).toHaveLength(1)
    for (const column of ['email', 'username', 'user_id', 'temp_password_hash', 'temp_password_expires_at', 'must_change_password']) {
      await expect(rows(`select ${column} from public.profiles`), column).rejects.toThrow(/permission denied/)
    }
    await expect(rows('select * from public.profiles')).rejects.toThrow(/permission denied/)
  })

  it('only admins get the list with emails and usernames', async () => {
    await asPerson(ANA)
    expect(await rows('select * from public.team_accounts()')).toEqual([])
    await asPerson(ADMIN)
    const accounts = await rows<{ username: string; email: string | null }>('select * from public.team_accounts()')
    expect(accounts.map((a) => a.username).sort()).toEqual(['admin', 'ana', 'ben', 'former', 'newbie'])
    expect(accounts.find((a) => a.username === 'ana')?.email).toBe('ana@p33.test')
    expect(accounts.find((a) => a.username === 'ben')?.email).toBeNull()
    expect(accounts[0]).not.toHaveProperty('temp_password_hash')
  })

  it('a temporary password hides the list from an admin too', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set role = 'admin', must_change_password = true where username = 'ana'`)
    await asPerson(ANA)
    expect(await rows('select * from public.team_accounts()')).toEqual([])
  })

  it('coaches can change their own name and colour, and nothing else', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    expect(await affected(`update public.profiles set name = 'Anita', color = '#000000' where id = '${ana}'`)).toBe(1)
    for (const assignment of [`role = 'admin'`, 'active = false', `email = 'x@p33.test'`, `username = 'otra'`, `user_id = '${ID.ben}'`]) {
      await expect(rows(`update public.profiles set ${assignment} where id = '${ana}'`), assignment).rejects.toThrow(/permission denied/)
    }
  })

  it('a monitor cannot edit another monitor', async () => {
    const ben = await profileId('ben')
    await asPerson(ANA)
    expect(await affected(`update public.profiles set name = 'Hackeado' where id = '${ben}'`)).toBe(0)
  })

  it('from the app nobody, not even an admin, adds, deletes or changes roles directly', async () => {
    const ben = await profileId('ben')
    await asPerson(ADMIN)
    await expect(rows(`insert into public.profiles (user_id, username) values ('${ID.stranger}', 'amigo')`)).rejects.toThrow(/permission denied/)
    await expect(rows(`delete from public.profiles where id = '${ben}'`)).rejects.toThrow(/permission denied/)
    await expect(rows(`update public.profiles set role = 'admin' where id = '${ben}'`)).rejects.toThrow(/permission denied/)
  })

  it('the function (service role) can create and change accounts', async () => {
    await asService()
    await rows(`insert into public.profiles (user_id, username, name, role, must_change_password) values ('${ID.stranger}', 'nueva', 'Nueva', 'monitor', true)`)
    expect(await affected(`update public.profiles set role = 'admin' where username = 'nueva'`)).toBe(1)
    expect(await rows(`select temp_password_hash from public.profiles where username = 'nueva'`)).toEqual([{ temp_password_hash: 'hash-stranger' }])
  })

  it('protects the last active admin, even from the function and the database owner', async () => {
    for (const enter of [asSuperuser, asService]) {
      await enter()
      await expect(rows(`update public.profiles set role = 'monitor' where username = 'admin'`)).rejects.toThrow(/profile_last_admin/)
      await expect(rows(`update public.profiles set active = false where username = 'admin'`)).rejects.toThrow(/profile_last_admin/)
      await expect(rows(`delete from public.profiles where username = 'admin'`)).rejects.toThrow(/profile_last_admin/)
    }
    await asSuperuser()
    await expect(db.exec(`delete from auth.users where id = '${ID.admin}'`)).rejects.toThrow(/profile_last_admin/)
  })

  it('an admin can go while another remains', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set role = 'admin' where username = 'ben'`)
    await db.exec(`update public.profiles set active = false where username = 'admin'`)
    await expect(db.exec(`update public.profiles set active = false where username = 'ben'`)).rejects.toThrow(/profile_last_admin/)
  })

  it('deleting a login deletes its account', async () => {
    await asSuperuser()
    await db.exec(`delete from auth.users where id = '${ID.ana}'`)
    expect(await rows(`select 1 from public.profiles where username = 'ana'`)).toEqual([])
  })

  it('closing the sessions of an account is only for the function', async () => {
    await asSuperuser()
    await db.exec(`
      insert into auth.sessions (user_id) values ('${ID.ana}'), ('${ID.ben}');
      insert into auth.refresh_tokens (user_id) values ('${ID.ana}'), ('${ID.ben}');
    `)
    await asPerson(ADMIN)
    await expect(rows(`select public.revoke_user_sessions('${ID.ana}')`)).rejects.toThrow(/permission denied/)
    await asService()
    await rows(`select public.revoke_user_sessions('${ID.ana}')`)
    await asSuperuser()
    expect(await rows('select user_id from auth.sessions')).toEqual([{ user_id: ID.ben }])
    expect(await rows('select user_id from auth.refresh_tokens')).toEqual([{ user_id: ID.ben }])
  })
})

describe('login limits', () => {
  const CLIENT = 'hash-ip'
  const reserve = async (username: string, client = CLIENT) =>
    (await rows<{ allowed: boolean }>('select public.login_reserve_attempt($1, $2) as allowed', [username, client]))[0].allowed
  const reserveTimes = async (times: number, username: string, client = CLIENT) => {
    let last = true
    for (let i = 0; i < times; i++) last = await reserve(username, client)
    return last
  }

  beforeEach(asService)

  it('the sixth attempt of a person from one connection is refused, and only that pair', async () => {
    expect(await reserveTimes(5, 'ana')).toBe(true)
    expect(await reserve('ana')).toBe(false)
    expect(await reserve('ben')).toBe(true)
  })

  it('a stranger cannot lock someone out from their own connection', async () => {
    await reserveTimes(10, 'ana', 'extrano')
    expect(await reserve('ana', 'gimnasio')).toBe(true)
  })

  it('many connections against one person are stopped too', async () => {
    for (let i = 0; i < 20; i++) expect(await reserve('ana', `ip-${i}`)).toBe(true)
    expect(await reserve('ana', 'otra-ip')).toBe(false)
  })

  it('one connection cannot go through every name, and adds no more rows once refused', async () => {
    for (let i = 0; i < 50; i++) expect(await reserve(`nombre${i}`)).toBe(true)
    expect(await reserve('otro.nombre')).toBe(false)
    await asSuperuser()
    expect(await rows(`select key from public.login_attempts where key like '%otro.nombre'`)).toEqual([])
  })

  it('entering clears the count of that person and gives the attempt back', async () => {
    await reserveTimes(5, 'ana')
    await rows('select public.login_clear_failures($1, $2)', ['ana', CLIENT])
    expect(await reserve('ana')).toBe(true)
    await asSuperuser()
    expect(await rows(`select failures from public.login_attempts where key = 'client:${CLIENT}'`)).toEqual([{ failures: 5 }])
  })

  it('a server failure gives the attempt back', async () => {
    await reserveTimes(5, 'ana')
    await rows('select public.login_release_attempt($1, $2)', ['ana', CLIENT])
    expect(await reserve('ana')).toBe(true)
  })

  it('an admin unlocks a person from every connection, without touching anyone else', async () => {
    await reserveTimes(6, 'ana')
    await reserveTimes(6, 'ana.b')
    await rows('select public.login_clear_username($1)', ['ana'])
    expect(await reserve('ana')).toBe(true)
    expect(await reserve('ana.b')).toBe(false)
  })

  it('expires after 15 minutes, and old rows are cleaned up', async () => {
    await reserveTimes(6, 'ana')
    await asSuperuser()
    await db.exec(`update public.login_attempts set first_failed_at = now() - interval '16 minutes'`)
    await asService()
    expect(await reserve('otra')).toBe(true)
    expect(await reserve('ana')).toBe(true)
    await asSuperuser()
    expect(await rows(`select failures from public.login_attempts where key = 'name:ana'`)).toEqual([{ failures: 1 }])
  })

  it('nobody but the function can see or use it', async () => {
    for (const enter of [() => asPerson(ADMIN), asAnon]) {
      await enter()
      await expect(count('login_attempts')).rejects.toThrow(/permission denied/)
      await expect(reserve('ana')).rejects.toThrow(/permission denied/)
      await expect(rows('select public.login_clear_username($1)', ['ana'])).rejects.toThrow(/permission denied/)
      await expect(rows(`select public.login_count_attempt('x', 5)`)).rejects.toThrow(/permission denied/)
    }
  })
})

describe('initial library', () => {
  const pending = async () => (await rows<{ pending: boolean }>('select public.library_seed_pending() as pending'))[0].pending
  const seed = async (exercises: Array<{ id: string; name: string }>) =>
    (
      await rows<{ seeded: boolean }>('select public.seed_library($1::jsonb) as seeded', [
        JSON.stringify(exercises.map(({ id, name }) => ({ id, data: { name }, client_origin: 'tab' }))),
      ])
    )[0].seeded

  it('is pending once for an admin, never for a monitor', async () => {
    await asPerson(ANA)
    expect(await pending()).toBe(false)
    await expect(seed([])).rejects.toThrow(/not_admin/)
    await asPerson(ADMIN)
    expect(await pending()).toBe(true)
    expect(await seed([{ id: 'l2', name: 'Nuevo' }])).toBe(true)
    expect(await pending()).toBe(false)
    expect(await count('library_exercises')).toBe(2)
  })

  it('never overwrites an existing row', async () => {
    await asPerson(ADMIN)
    await seed([{ id: 'l1', name: 'Otro' }])
    expect(await rows(`select data from public.library_exercises where id = 'l1'`)).toEqual([{ data: { name: 'Remo' } }])
  })

  it('goes in whole or not at all', async () => {
    await asPerson(ADMIN)
    await expect(rows('select public.seed_library($1::jsonb)', [JSON.stringify([{ id: 'l2', data: { name: 'Bien' } }, { id: 'l3', data: {} }])])).rejects.toThrow(/data/)
    expect(await count('library_exercises')).toBe(1)
    expect(await pending()).toBe(true)
  })

  it('a second upload, from another admin too, brings nothing back', async () => {
    await asPerson(ADMIN)
    await seed([{ id: 'l2', name: 'Nuevo' }])
    await rows('delete from public.library_exercises')
    expect(await seed([{ id: 'l2', name: 'Nuevo' }])).toBe(false)
    expect(await count('library_exercises')).toBe(0)
    expect(await pending()).toBe(false)
  })

  it('works on a database with no settings row, and keeps the default branding', async () => {
    await asSuperuser()
    await db.exec('delete from public.settings')
    await asPerson(ADMIN)
    await seed([])
    expect(await pending()).toBe(false)
    expect(await rows('select data from public.settings')).toEqual([{ data: {} }])
  })

  it('saving the branding later does not undo it', async () => {
    await asPerson(ADMIN)
    await seed([])
    await rows(`insert into public.settings (id, data) values ('main', '{"gymName":"Otro"}') on conflict (id) do update set data = excluded.data`)
    expect(await pending()).toBe(false)
  })
})

describe('history of changes', () => {
  it('keeps what was there before a change or a delete', async () => {
    await asPerson(ANA)
    await rows(`update public.clients set data = '{"firstName":"Otra"}' where id = 'c1'`)
    await rows(`delete from public.programs where id = 'p1'`)
    await asSuperuser()
    const ana = await profileId('ana')
    expect(await rows('select table_name, row_id, operation, data, changed_by from public.row_history order by id')).toEqual([
      { table_name: 'clients', row_id: 'c1', operation: 'UPDATE', data: { firstName: 'Laura' }, changed_by: ana },
      { table_name: 'programs', row_id: 'p1', operation: 'DELETE', data: { clientId: 'c1' }, changed_by: ana },
    ])
  })

  it('a save that changes nothing adds nothing, and old copies go away', async () => {
    await asSuperuser()
    await db.exec(`
      insert into public.row_history (table_name, row_id, operation, data, changed_at) values ('clients', 'viejo', 'UPDATE', '{}', now() - interval '31 days');
      update public.clients set data = data where id = 'c1';
    `)
    expect(await count('row_history')).toBe(1)
    await db.exec(`update public.clients set data = '{"firstName":"Otra"}' where id = 'c1'`)
    expect(await rows('select row_id from public.row_history')).toEqual([{ row_id: 'c1' }])
  })

  it('nobody reads it from the app', async () => {
    for (const enter of [() => asPerson(ADMIN), () => asPerson(ANA), asAnon]) {
      await enter()
      await expect(count('row_history')).rejects.toThrow(/permission denied/)
    }
  })

  it('a row cannot be emptied with one request', async () => {
    await asPerson(ANA)
    await expect(rows(`update public.clients set data = '{}' where true`)).rejects.toThrow(/data/)
    await expect(rows(`update public.programs set data = '{}' where true`)).rejects.toThrow(/data/)
    await expect(rows(`update public.library_exercises set data = '{}' where true`)).rejects.toThrow(/data/)
  })
})

describe('active coaches and shared data', () => {
  it('only the admin can delete a client: a monitor archives', async () => {
    await asPerson(ANA)
    expect(await affected(`delete from public.clients where true`)).toBe(0)
    expect(await count('clients')).toBe(1)
    await asPerson(ADMIN)
    expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(1)
  })

  it('can read and write clients, programs and the whole library', async () => {
    await asPerson(ANA)
    expect(await count('clients')).toBe(1)
    await rows(`insert into public.clients (id, data) values ('c2', '{"firstName":"Otra"}')`)
    await rows(`insert into public.programs (id, data) values ('p2', '{"clientId":"c2"}')`)
    await rows(`insert into public.library_exercises (id, data) values ('l2', '{"name":"Nuevo"}')`)
    expect(await affected(`update public.clients set data = '{"firstName":"Laura","a":1}' where id = 'c1'`)).toBe(1)
    expect(await affected(`update public.library_exercises set data = '{"name":"Editado","link":"https://x.test"}' where id = 'l1'`)).toBe(1)
    expect(await affected(`delete from public.library_exercises where id = 'l1'`)).toBe(1)
  })

  it('stamps author and date on the server, whatever the browser sends', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await rows(`insert into public.clients (id, data, updated_by, updated_at) values ('c2', '{"firstName":"Otra"}', '${ben}', '2000-01-01')`)
    const [row] = await rows<{ updated_by: string; updated_at: Date }>(`select updated_by, updated_at from public.clients where id = 'c2'`)
    expect(row.updated_by).toBe(ana)
    expect(new Date(row.updated_at).getFullYear()).toBeGreaterThan(2000)
  })

  it('branding: everyone reads it, only the admin changes it', async () => {
    await asPerson(ANA)
    expect(await count('settings')).toBe(1)
    expect(await affected(`update public.settings set data = '{}'`)).toBe(0)
    expect(await affected(`delete from public.settings`)).toBe(0)
    await asPerson(ADMIN)
    expect(await affected(`update public.settings set data = '{"gymName":"Nuevo"}'`)).toBe(1)
  })
})

describe('private notes', () => {
  const insertNote = (id: string, author: string | null) =>
    rows(`insert into public.notes (id, data, author_profile_id, client_id) values ($1, '{}', $2, 'c1')`, [id, author])

  it('are read by the whole team', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await count('notes')).toBe(1)
  })

  it('can only be signed with your own name', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await expect(insertNote('n1', ben)).rejects.toThrow(/row-level security/)
    await expect(insertNote('n2', null)).rejects.toThrow(/row-level security/)
    await insertNote('n3', ana)
    expect(await count('notes')).toBe(1)
  })

  it('can only be edited or deleted by their author', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await affected(`update public.notes set data = '{"text":"x"}' where id = 'n1'`)).toBe(0)
    expect(await affected(`delete from public.notes where id = 'n1'`)).toBe(0)
    await asPerson(ANA)
    expect(await affected(`update public.notes set data = '{"text":"y"}' where id = 'n1'`)).toBe(1)
    expect(await affected(`delete from public.notes where id = 'n1'`)).toBe(1)
  })

  it('cannot be handed over to someone else', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await expect(rows(`update public.notes set author_profile_id = '${ben}' where id = 'n1'`)).rejects.toThrow(/row-level security/)
  })

  it('an upsert over a note from someone else is refused', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    await expect(
      rows(
        `insert into public.notes (id, data, author_profile_id, client_id) values ('n1', '{}', '${ben}', 'c1')
         on conflict (id) do update set data = excluded.data, author_profile_id = excluded.author_profile_id`,
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('the admin can edit, delete and restore notes from others', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(ADMIN)
    expect(await affected(`update public.notes set data = '{"text":"z"}' where id = 'n1'`)).toBe(1)
    expect(await affected(`delete from public.notes where id = 'n1'`)).toBe(1)
    await insertNote('n1', ana)
    expect(await count('notes')).toBe(1)
  })

  it('survive a monitor trying to delete their client', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(0)
    expect(await count('notes')).toBe(1)
  })

  it('go away with their client when the admin deletes it, and undoing it brings them back', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(ADMIN)
    expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(1)
    expect(await count('notes')).toBe(0)
    await rows(`insert into public.clients (id, data) values ('c1', '{"firstName":"Laura"}')`)
    await insertNote('n1', ana)
    expect(await count('notes')).toBe(1)
  })

  it('keep existing, without signature, when their author is deleted', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asSuperuser()
    await db.exec(`delete from auth.users where id = '${ID.ana}'`)
    const [note] = await rows<{ author_profile_id: string | null }>(`select author_profile_id from public.notes where id = 'n1'`)
    expect(note.author_profile_id).toBeNull()
  })
})

describe('TV screens and their sections', () => {
  const SECTION = (clientId: string | null, day = 1) => JSON.stringify({ clientId, day, assignedAt: '2026-11-06T10:00:00.000Z' })

  it('every active coach reads and writes them, and the server stamps who', async () => {
    const ben = await profileId('ben')
    await asPerson(BEN)
    expect(await count('screens')).toBe(1)
    expect(await count('screen_sections')).toBe(1)
    await rows(`insert into public.screens (id, data) values ('2', '{"name":"Pantalla 2","sections":6}')`)
    await rows(`insert into public.screen_sections (id, screen_id, data) values ('2:6', '2', $1)`, [SECTION(null)])
    expect(await affected(`update public.screen_sections set data = $1 where id = '1:1'`, [SECTION('c1', 3)])).toBe(1)
    const [row] = await rows<{ updated_by: string }>(`select updated_by from public.screen_sections where id = '1:1'`)
    expect(row.updated_by).toBe(ben)
    expect(await affected(`delete from public.screen_sections where id = '2:6'`)).toBe(1)
    expect(await affected(`delete from public.screens where id = '2'`)).toBe(1)
  })

  it('sending the default screens twice, also at the same time, creates them once and changes nothing', async () => {
    await asPerson(ANA)
    const insertDefaults = `insert into public.screens (id, data) values
      ('1', '{"name":"Pantalla 1","sections":3}'), ('2', '{"name":"Pantalla 2","sections":3}') on conflict (id) do nothing`
    await rows(`update public.screens set data = '{"name":"Sala","sections":4}' where id = '1'`)
    await rows(insertDefaults)
    await rows(insertDefaults)
    expect(await rows(`select id, data ->> 'name' as name from public.screens order by id`)).toEqual([
      { id: '1', name: 'Sala' },
      { id: '2', name: 'Pantalla 2' },
    ])
  })

  it('only accepts screens 1 to 8 with 1 to 6 sections and a name', async () => {
    await asPerson(ANA)
    for (const [id, data] of [
      ['9', '{"name":"P","sections":3}'],
      ['0', '{"name":"P","sections":3}'],
      ['2', '{"name":"P","sections":7}'],
      ['2', '{"name":"P","sections":0}'],
      ['2', '{"name":"P","sections":2.5}'],
      ['2', '{"name":"P","sections":"3"}'],
      ['2', '{"name":"   ","sections":3}'],
      ['2', `{"name":"${'a'.repeat(31)}","sections":3}`],
      ['2', '{"sections":3}'],
      ['2', '{"name":"P","sections":3,"notes":"lesión de hombro"}'],
    ]) {
      await expect(rows('insert into public.screens (id, data) values ($1, $2)', [id, data])).rejects.toThrow(/check constraint/)
    }
  })

  it('a section holds only a person, a day and when it was sent: nothing private fits', async () => {
    await asPerson(ANA)
    const insert = (id: string, screen: string, data: string) =>
      rows('insert into public.screen_sections (id, screen_id, data) values ($1, $2, $3)', [id, screen, data])
    await expect(insert('1:7', '1', SECTION(null))).rejects.toThrow(/check constraint/)
    await expect(insert('2:1', '1', SECTION(null))).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":"c1","day":0,"assignedAt":"x"}')).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":"c1","assignedAt":"x"}')).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":5,"day":1,"assignedAt":"x"}')).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":"c1","day":1,"assignedAt":"x","goal":"perder peso"}')).rejects.toThrow(/check constraint/)
    await expect(insert('3:1', '3', SECTION(null))).rejects.toThrow(/foreign key/)
    await insert('1:2', '1', SECTION(null))
    expect(await count('screen_sections')).toBe(2)
  })

  it('removing a screen takes its sections with it, and nothing else', async () => {
    await asPerson(ANA)
    await rows(`insert into public.screens (id, data) values ('2', '{"name":"Pantalla 2","sections":3}')`)
    await rows(`insert into public.screen_sections (id, screen_id, data) values ('2:1', '2', $1)`, [SECTION('c1')])
    await rows(`delete from public.screens where id = '1'`)
    expect(await rows('select id from public.screen_sections')).toEqual([{ id: '2:1' }])
    expect(await count('clients')).toBe(1)
  })

  it('are not part of the history of changes', async () => {
    await asPerson(ANA)
    await rows(`update public.screen_sections set data = $1 where id = '1:1'`, [SECTION(null)])
    await asSuperuser()
    expect(await count('row_history')).toBe(0)
  })

  it('running the whole file again over a gym in use keeps every screen and section', async () => {
    await asPerson(ANA)
    await rows(`insert into public.screens (id, data) values ('2', '{"name":"Sala grande","sections":6}')`)
    await rows(`insert into public.screen_sections (id, screen_id, data) values ('2:5', '2', $1)`, [SECTION('c1', 2)])
    await asSuperuser()
    const before = await rows('select * from public.screens order by id')
    const sectionsBefore = await rows('select * from public.screen_sections order by id')
    await db.exec(SCHEMA)
    expect(await rows('select * from public.screens order by id')).toEqual(before)
    expect(await rows('select * from public.screen_sections order by id')).toEqual(sectionsBefore)
    expect(await count('clients')).toBe(1)
    await asPerson(BEN)
    expect(await count('screen_sections')).toBe(2)
    await asAnon()
    await expect(count('screens')).rejects.toThrow(/permission denied/)
  })
})

describe('TV screens: limits, cleanup and who sees which TVs are open', () => {
  const SENT_AT = '2026-11-06T10:00:00.000Z'
  const section = (clientId: string | null, assignedAt = SENT_AT) => JSON.stringify({ clientId, day: 1, assignedAt })
  const insertSection = (id: string, data: string) =>
    rows('insert into public.screen_sections (id, screen_id, data) values ($1, $2, $3)', [id, id.split(':')[0], data])
  const setSections = (screen: string, sections: number) =>
    rows(`update public.screens set data = jsonb_build_object('name', 'P', 'sections', $2::int) where id = $1`, [screen, sections])
  const sectionIds = async () => (await rows<{ id: string }>('select id from public.screen_sections order by id')).map((r) => r.id)
  const presenceRows = async () => (await rows('select id from realtime.messages')).length

  it('allows exactly the limits the app uses', async () => {
    await asPerson(ANA)
    const screen = (id: number, sections: number, name = 'P') =>
      rows('insert into public.screens (id, data) values ($1, $2)', [String(id), JSON.stringify({ name, sections })])
    await screen(TV_MAX_SCREENS, TV_MAX_SECTIONS, 'a'.repeat(TV_SCREEN_NAME_MAX_LENGTH))
    await expect(screen(TV_MAX_SCREENS + 1, TV_MIN_SECTIONS)).rejects.toThrow(/check constraint/)
    await expect(screen(2, TV_MAX_SECTIONS + 1)).rejects.toThrow(/check constraint/)
    await expect(screen(2, TV_MIN_SECTIONS - 1)).rejects.toThrow(/check constraint/)
    await expect(screen(2, TV_MIN_SECTIONS, 'a'.repeat(TV_SCREEN_NAME_MAX_LENGTH + 1))).rejects.toThrow(/check constraint/)
    await insertSection(`${TV_MAX_SCREENS}:${TV_MAX_SECTIONS}`, section(null))
    await expect(insertSection(`${TV_MAX_SCREENS}:${TV_MAX_SECTIONS + 1}`, section(null))).rejects.toThrow(/check constraint/)
  })

  it('a section takes only an id like the app makes and an ISO time (or none): no free text', async () => {
    await asPerson(ANA)
    await insertSection('1:2', section('cli_AE77VPj-SM'))
    await insertSection('1:3', section(null, ''))
    for (const data of [
      section('lesión de hombro'),
      section('a'.repeat(65)),
      section(''),
      section('c1', 'lesión de hombro'),
      section('c1', '2026-11-06'),
      section('c1', `${SENT_AT} y algo más`),
    ]) {
      await expect(insertSection('1:4', data)).rejects.toThrow(/check constraint/)
    }
  })

  it('fewer sections empties the ones left out in the same change, and more starts the new ones empty', async () => {
    await asPerson(ANA)
    await setSections('1', 6)
    for (const id of ['1:2', '1:5', '1:6']) await insertSection(id, section('c1'))
    await setSections('1', 4)
    expect(await sectionIds()).toEqual(['1:1', '1:2'])
    // A section written past the count (a window that had not heard of the change) never comes back into view.
    await insertSection('1:6', section('c1'))
    await setSections('1', 6)
    expect(await sectionIds()).toEqual(['1:1', '1:2'])
    await rows(`update public.screens set data = '{"name":"Otro nombre","sections":6}' where id = '1'`)
    expect(await sectionIds()).toEqual(['1:1', '1:2'])
  })

  it('running the file again updates a rule of a table that already exists, and keeps the rows it finds', async () => {
    await asSuperuser()
    const longName = 'a'.repeat(TV_SCREEN_NAME_MAX_LENGTH + 5)
    await db.exec('alter table public.screens drop constraint screens_data_check')
    await db.query('insert into public.screens (id, data) values ($1, $2)', ['2', JSON.stringify({ name: longName, sections: 3 })])
    await db.exec(SCHEMA)
    expect(await count('screens')).toBe(2)
    await asPerson(ANA)
    await expect(rows(`insert into public.screens (id, data) values ('3', '{"name":"P","sections":9}')`)).rejects.toThrow(/check constraint/)
    await asSuperuser()
    await db.exec(`delete from public.screens where id = '2'; alter table public.screens validate constraint screens_data_check;`)
  })

  it('only active coaches see and announce which TV windows are open', async () => {
    const onTopic = (topic: string) => db.query(`select set_config('realtime.topic', $1, false)`, [topic])
    const announce = () => rows(`insert into realtime.messages (topic, extension, payload) values ('p33-screens-presence', 'presence', '{}')`)
    await asPerson(ANA)
    await onTopic('p33-screens-presence')
    await announce()
    expect(await presenceRows()).toBe(1)
    await expect(rows(`insert into realtime.messages (topic, extension) values ('p33-screens-presence', 'broadcast')`)).rejects.toThrow(
      /row-level security/,
    )
    await onTopic('otro-canal')
    expect(await presenceRows()).toBe(0)
    await expect(rows(`insert into realtime.messages (topic, extension) values ('otro-canal', 'presence')`)).rejects.toThrow(/row-level security/)
    for (const who of [STRANGER, FORMER, NEWBIE]) {
      await asPerson(who)
      await onTopic('p33-screens-presence')
      expect(await presenceRows()).toBe(0)
      await expect(announce()).rejects.toThrow(/row-level security/)
    }
    await asAnon()
    await onTopic('p33-screens-presence')
    expect(await presenceRows()).toBe(0)
    await expect(announce()).rejects.toThrow(/row-level security/)
    await asSuperuser()
    await db.exec('truncate realtime.messages')
  })
})

describe('schema.sql over the database of the live project', () => {
  it('adds the TV screens next to the data in use, twice in a row, without touching it', async () => {
    const live = new PGlite()
    await live.exec(SUPABASE_STUBS)
    await live.exec(PREVIOUS_SCHEMA)
    await live.exec(`
      insert into auth.users (id, email) values ('${ID.admin}', 'admin@p33.test');
      insert into public.profiles (user_id, username, email, name, role, must_change_password)
        values ('${ID.admin}', 'admin', 'admin@p33.test', 'Admin', 'admin', false);
      insert into public.clients (id, data) values ('c1', '{"firstName":"Laura"}');
      insert into public.programs (id, data) values ('p1', '{"clientId":"c1"}');
      insert into public.settings (id, data) values ('main', '{"gymName":"P33"}');
    `)
    const snapshot = async () => ({
      clients: (await live.query('select * from public.clients order by id')).rows,
      programs: (await live.query('select * from public.programs order by id')).rows,
      settings: (await live.query('select * from public.settings')).rows,
      profiles: (await live.query('select * from public.profiles')).rows,
    })
    const before = await snapshot()
    await live.exec(SCHEMA)
    await live.exec(SCHEMA)
    expect(await snapshot()).toEqual(before)
    const secured = await live.query(`select relname, relrowsecurity from pg_class where relname in ('screens', 'screen_sections') order by relname`)
    expect(secured.rows).toEqual([
      { relname: 'screen_sections', relrowsecurity: true },
      { relname: 'screens', relrowsecurity: true },
    ])
    const grants = await live.query(
      `select grantee, privilege_type from information_schema.role_table_grants
       where table_name = 'screens' and grantee in ('anon', 'authenticated') order by grantee, privilege_type`,
    )
    expect(grants.rows).toEqual(['DELETE', 'INSERT', 'SELECT', 'UPDATE'].map((privilege_type) => ({ grantee: 'authenticated', privilege_type })))
    await live.exec('set role anon')
    await expect(live.query('select * from public.screens')).rejects.toThrow(/permission denied/)
    await live.close()
  })
})
