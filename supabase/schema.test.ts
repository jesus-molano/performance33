// Runs schema.sql on a real Postgres (PGlite) with stand-ins for what Supabase provides
// (auth schema, roles, realtime publication) and checks the access rules as each kind of user.

import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema auth, public to anon, authenticated, service_role;
  create table auth.users (id uuid primary key, email text, encrypted_password text);
  create table auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users (id) on delete cascade);
  create table auth.refresh_tokens (id bigserial primary key, user_id varchar(255));
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt() ->> 'sub')::uuid $$;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  create publication supabase_realtime;
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

async function seedPeople(): Promise<void> {
  await asSuperuser()
  await db.exec(`
    truncate public.profiles, public.login_attempts, public.clients, public.programs, public.library_exercises, public.notes, public.settings cascade;
    delete from auth.users;
    delete from auth.refresh_tokens;
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
      ('${ID.newbie}', 'newbie', null, 'Novata', 'monitor', true),
      ('${ID.former}', 'former', 'former@p33.test', 'Antigua', 'monitor', false);
    update public.profiles set active = false where username = 'former';
    insert into public.clients (id, data) values ('c1', '{"firstName":"Laura"}');
    insert into public.programs (id, data) values ('p1', '{"clientId":"c1"}');
    insert into public.library_exercises (id, data) values ('l1', '{"name":"Remo"}');
    insert into public.settings (id, data) values ('main', '{"gymName":"P33"}');
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
    await expect(rows(`update public.profiles set name = repeat('a', 61) where id = public.current_profile_id()`)).rejects.toThrow(/name/)
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
    expect(tables.map((t) => t.tablename)).toEqual(['clients', 'library_exercises', 'notes', 'profiles', 'programs', 'settings'])
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

  it('does not ask it of someone who entered with Google', async () => {
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

  it('the same account entering with Google can read everything', async () => {
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await count('clients')).toBe(1)
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
  const TABLES = ['clients', 'programs', 'library_exercises', 'notes', 'settings']

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
    for (const column of ['email', 'username', 'user_id', 'temp_password_hash', 'must_change_password']) {
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

describe('login lockout', () => {
  const locked = async (username: string) => (await rows<{ locked: boolean }>('select public.login_is_locked($1) as locked', [username]))[0].locked
  const fail = (username: string) => rows('select public.login_record_failure($1)', [username])

  beforeEach(asService)

  it('locks a username after 5 failures, not before, and only that one', async () => {
    for (let i = 0; i < 4; i++) await fail('ana')
    expect(await locked('ana')).toBe(false)
    await fail('ana')
    expect(await locked('ana')).toBe(true)
    expect(await locked('ben')).toBe(false)
  })

  it('a success clears the count', async () => {
    for (let i = 0; i < 5; i++) await fail('ana')
    await rows('select public.login_clear_failures($1)', ['ana'])
    expect(await locked('ana')).toBe(false)
  })

  it('expires after 15 minutes, and old rows are cleaned up', async () => {
    for (let i = 0; i < 5; i++) await fail('ana')
    await asSuperuser()
    await db.exec(`update public.login_attempts set first_failed_at = now() - interval '16 minutes'`)
    await asService()
    expect(await locked('ana')).toBe(false)
    await fail('otra')
    expect(await rows('select username, failures from public.login_attempts')).toEqual([{ username: 'otra', failures: 1 }])
  })

  it('nobody but the function can see or use it', async () => {
    for (const enter of [() => asPerson(ADMIN), asAnon]) {
      await enter()
      await expect(count('login_attempts')).rejects.toThrow(/permission denied/)
      await expect(locked('ana')).rejects.toThrow(/permission denied/)
      await expect(fail('ana')).rejects.toThrow(/permission denied/)
    }
  })
})

describe('initial library', () => {
  const pending = async () => (await rows<{ pending: boolean }>('select public.library_seed_pending() as pending'))[0].pending

  it('is pending once for an admin, never for a monitor', async () => {
    await asPerson(ANA)
    expect(await pending()).toBe(false)
    await expect(rows('select public.finish_library_seed()')).rejects.toThrow(/not_admin/)
    await asPerson(ADMIN)
    expect(await pending()).toBe(true)
    await rows('select public.finish_library_seed()')
    expect(await pending()).toBe(false)
  })

  it('does not come back after emptying the library', async () => {
    await asPerson(ADMIN)
    await rows('select public.finish_library_seed()')
    await rows('delete from public.library_exercises')
    expect(await pending()).toBe(false)
  })

  it('finishing works on a database with no settings row, and keeps the default branding', async () => {
    await asSuperuser()
    await db.exec('delete from public.settings')
    await asPerson(ADMIN)
    await rows('select public.finish_library_seed()')
    expect(await pending()).toBe(false)
    expect(await rows('select data from public.settings')).toEqual([{ data: {} }])
  })

  it('saving the branding later does not undo it', async () => {
    await asPerson(ADMIN)
    await rows('select public.finish_library_seed()')
    await rows(`insert into public.settings (id, data) values ('main', '{"gymName":"Otro"}') on conflict (id) do update set data = excluded.data`)
    expect(await pending()).toBe(false)
  })

  it('only the first batch wins: a repeated upload does not overwrite edits', async () => {
    await asPerson(ADMIN)
    await rows(`insert into public.library_exercises (id, data) values ('l1', '{"name":"Otro"}') on conflict (id) do nothing`)
    expect(await rows(`select data from public.library_exercises where id = 'l1'`)).toEqual([{ data: { name: 'Remo' } }])
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
    await rows(`insert into public.clients (id, data) values ('c2', '{}')`)
    await rows(`insert into public.programs (id, data) values ('p2', '{}')`)
    await rows(`insert into public.library_exercises (id, data) values ('l2', '{}')`)
    expect(await affected(`update public.clients set data = '{"a":1}' where id = 'c1'`)).toBe(1)
    expect(await affected(`update public.library_exercises set data = '{"name":"Editado","link":"https://x.test"}' where id = 'l1'`)).toBe(1)
    expect(await affected(`delete from public.library_exercises where id = 'l1'`)).toBe(1)
  })

  it('stamps author and date on the server, whatever the browser sends', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await rows(`insert into public.clients (id, data, updated_by, updated_at) values ('c2', '{}', '${ben}', '2000-01-01')`)
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
    await rows(`insert into public.clients (id, data) values ('c1', '{}')`)
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
