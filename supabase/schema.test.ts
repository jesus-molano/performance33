// Runs schema.sql on a real Postgres (PGlite) with stand-ins for what Supabase provides
// (auth schema, roles, realtime publication) and checks the access rules as each kind of user.

import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  grant usage on schema auth, public to anon, authenticated;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt() ->> 'sub')::uuid $$;
  grant execute on all functions in schema auth to anon, authenticated;
  create publication supabase_realtime;
`

const ID = {
  admin: '00000000-0000-4000-8000-000000000001',
  ana: '00000000-0000-4000-8000-000000000002',
  ben: '00000000-0000-4000-8000-000000000003',
  stranger: '00000000-0000-4000-8000-000000000004',
  unverified: '00000000-0000-4000-8000-000000000005',
  former: '00000000-0000-4000-8000-000000000006',
}

interface Person {
  id: string
  email: string
}

const ADMIN: Person = { id: ID.admin, email: 'admin@p33.test' }
const ANA: Person = { id: ID.ana, email: 'ana@p33.test' }
const BEN: Person = { id: ID.ben, email: 'ben@p33.test' }
const STRANGER: Person = { id: ID.stranger, email: 'stranger@p33.test' }
const UNVERIFIED: Person = { id: ID.unverified, email: 'unverified@p33.test' }
const FORMER: Person = { id: ID.former, email: 'former@p33.test' }

let db: PGlite

async function asSuperuser(): Promise<void> {
  await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`)
}

async function asPerson(person: Person): Promise<void> {
  const claims = JSON.stringify({ sub: person.id, email: person.email })
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims])
  await db.exec('set role authenticated')
}

async function asAnon(): Promise<void> {
  await db.exec(`select set_config('request.jwt.claims', '', false); set role anon;`)
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

const staffId = async (email: string): Promise<string> => {
  await asSuperuser()
  return (await rows<{ id: string }>('select id from public.staff where email = $1', [email]))[0].id
}

async function seedPeople(): Promise<void> {
  await asSuperuser()
  await db.exec(`
    truncate public.staff, public.clients, public.programs, public.library_exercises, public.notes, public.settings cascade;
    delete from auth.users;
    insert into auth.users (id, email, email_confirmed_at) values
      ('${ID.admin}', 'admin@p33.test', now()),
      ('${ID.ana}', 'ana@p33.test', now()),
      ('${ID.ben}', 'ben@p33.test', now()),
      ('${ID.stranger}', 'stranger@p33.test', now()),
      ('${ID.unverified}', 'unverified@p33.test', null),
      ('${ID.former}', 'former@p33.test', now());
    insert into public.staff (email, name, role, active) values
      ('admin@p33.test', 'Admin', 'admin', true),
      ('ana@p33.test', 'Ana', 'monitor', true),
      ('ben@p33.test', 'Ben', 'monitor', true),
      ('unverified@p33.test', 'Sin verificar', 'monitor', true),
      ('former@p33.test', 'Antigua', 'monitor', true);
  `)
  for (const person of [ADMIN, ANA, BEN, FORMER]) {
    await asPerson(person)
    await rows('select * from public.claim_staff_profile()')
  }
  await asSuperuser()
  await db.exec(`
    update public.staff set active = false where email = 'former@p33.test';
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
    // Placeholder admin from the last section of the file: no real address in the repo.
    expect(await rows('select 1 from public.staff where email = $1', ['tu_email@ejemplo.com'])).toHaveLength(1)
  })

  it('publishes every table for realtime', async () => {
    await asSuperuser()
    const tables = await rows<{ tablename: string }>(
      `select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename`,
    )
    expect(tables.map((t) => t.tablename)).toEqual(['clients', 'library_exercises', 'notes', 'programs', 'settings', 'staff'])
  })

  it('keeps emails lower-cased', async () => {
    await asPerson(ADMIN)
    await rows(`insert into public.staff (email, name) values ('  Nueva@P33.TEST ', 'Nueva')`)
    await asSuperuser()
    expect(await rows('select 1 from public.staff where email = $1', ['nueva@p33.test'])).toHaveLength(1)
  })
})

describe('claim_staff_profile', () => {
  it('links an active staff row to a verified account, and returns it', async () => {
    await asSuperuser()
    await db.exec(`update public.staff set user_id = null where email = 'ana@p33.test'`)
    await asPerson(ANA)
    const [row] = await rows<{ email: string; user_id: string }>('select * from public.claim_staff_profile()')
    expect(row.email).toBe('ana@p33.test')
    expect(row.user_id).toBe(ID.ana)
  })

  it('refuses an email that is not verified', async () => {
    await asPerson(UNVERIFIED)
    expect(await rows('select * from public.claim_staff_profile()')).toEqual([])
    await asSuperuser()
    const [row] = await rows<{ user_id: string | null }>(`select user_id from public.staff where email = 'unverified@p33.test'`)
    expect(row.user_id).toBeNull()
  })

  it('refuses people who are not on the list', async () => {
    await asPerson(STRANGER)
    expect(await rows('select * from public.claim_staff_profile()')).toEqual([])
  })

  it('refuses a deactivated person', async () => {
    await asPerson(FORMER)
    expect(await rows('select * from public.claim_staff_profile()')).toEqual([])
  })

  it('never trusts a forged email claim: the account email must match', async () => {
    await asSuperuser()
    await db.exec(`update public.staff set user_id = null where email = 'ana@p33.test'`)
    await asPerson({ id: ID.stranger, email: 'ana@p33.test' })
    expect(await rows('select * from public.claim_staff_profile()')).toEqual([])
  })

  it('cannot take over a row already linked to another account', async () => {
    await asSuperuser()
    await db.exec(`update auth.users set email = 'ana@p33.test' where id = '${ID.stranger}'`)
    await asPerson({ id: ID.stranger, email: 'ana@p33.test' })
    expect(await rows('select * from public.claim_staff_profile()')).toEqual([])
    await asSuperuser()
    const [row] = await rows<{ user_id: string }>(`select user_id from public.staff where email = 'ana@p33.test'`)
    expect(row.user_id).toBe(ID.ana)
  })
})

describe('people without access', () => {
  const TABLES = ['staff', 'clients', 'programs', 'library_exercises', 'notes', 'settings']

  for (const [label, enter] of [
    ['a signed-in stranger', () => asPerson(STRANGER)],
    ['a deactivated coach', () => asPerson(FORMER)],
  ] as const) {
    it(`${label} sees nothing and can write nothing`, async () => {
      await enter()
      for (const table of TABLES) expect(await count(table)).toBe(0)
      await expect(rows(`insert into public.clients (id, data) values ('x', '{}')`)).rejects.toThrow(/row-level security/)
      await expect(rows(`insert into public.settings (id, data) values ('main', '{}')`)).rejects.toThrow(/row-level security/)
      await expect(rows(`insert into public.staff (email) values ('hacker@p33.test')`)).rejects.toThrow(/row-level security/)
      expect(await affected(`update public.clients set data = '{}' where id = 'c1'`)).toBe(0)
      expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(0)
    })
  }

  it('anonymous visitors have no permissions at all', async () => {
    await asAnon()
    for (const table of TABLES) await expect(count(table)).rejects.toThrow(/permission denied/)
    await expect(rows('select * from public.claim_staff_profile()')).rejects.toThrow(/permission denied/)
  })
})

describe('active coaches and shared data', () => {
  it('can read and write clients, programs and the library', async () => {
    await asPerson(ANA)
    expect(await count('clients')).toBe(1)
    await rows(`insert into public.clients (id, data) values ('c2', '{}')`)
    await rows(`insert into public.programs (id, data) values ('p2', '{}')`)
    await rows(`insert into public.library_exercises (id, data) values ('l2', '{}')`)
    expect(await affected(`update public.clients set data = '{"a":1}' where id = 'c1'`)).toBe(1)
    expect(await affected(`delete from public.library_exercises where id = 'l1'`)).toBe(1)
  })

  it('stamps author and date on the server, whatever the browser sends', async () => {
    const ana = await staffId('ana@p33.test')
    const ben = await staffId('ben@p33.test')
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
    rows(`insert into public.notes (id, data, author_staff_id, client_id) values ($1, '{}', $2, 'c1')`, [id, author])

  it('are read by the whole team', async () => {
    const ana = await staffId('ana@p33.test')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await count('notes')).toBe(1)
  })

  it('can only be signed with your own name', async () => {
    const ana = await staffId('ana@p33.test')
    const ben = await staffId('ben@p33.test')
    await asPerson(ANA)
    await expect(insertNote('n1', ben)).rejects.toThrow(/row-level security/)
    await expect(insertNote('n2', null)).rejects.toThrow(/row-level security/)
    await insertNote('n3', ana)
    expect(await count('notes')).toBe(1)
  })

  it('can only be edited or deleted by their author', async () => {
    const ana = await staffId('ana@p33.test')
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
    const ana = await staffId('ana@p33.test')
    const ben = await staffId('ben@p33.test')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await expect(rows(`update public.notes set author_staff_id = '${ben}' where id = 'n1'`)).rejects.toThrow(/row-level security/)
  })

  it('an upsert over a note from someone else is refused', async () => {
    const ana = await staffId('ana@p33.test')
    const ben = await staffId('ben@p33.test')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    await expect(
      rows(
        `insert into public.notes (id, data, author_staff_id, client_id) values ('n1', '{}', '${ben}', 'c1')
         on conflict (id) do update set data = excluded.data, author_staff_id = excluded.author_staff_id`,
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('the admin can edit, delete and restore notes from others', async () => {
    const ana = await staffId('ana@p33.test')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(ADMIN)
    expect(await affected(`update public.notes set data = '{"text":"z"}' where id = 'n1'`)).toBe(1)
    expect(await affected(`delete from public.notes where id = 'n1'`)).toBe(1)
    await insertNote('n1', ana)
    expect(await count('notes')).toBe(1)
  })

  it('go away with their client, even when written by another coach', async () => {
    const ana = await staffId('ana@p33.test')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(1)
    expect(await count('notes')).toBe(0)
  })

  it('keep existing when their author is removed from the team', async () => {
    const ana = await staffId('ana@p33.test')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(ADMIN)
    expect(await affected(`delete from public.staff where email = 'ana@p33.test'`)).toBe(1)
    const [note] = await rows<{ author_staff_id: string | null }>(`select author_staff_id from public.notes where id = 'n1'`)
    expect(note.author_staff_id).toBeNull()
  })
})

describe('the team list', () => {
  it('coaches can change their own name and colour', async () => {
    await asPerson(ANA)
    expect(await affected(`update public.staff set name = 'Anita', color = '#000000' where email = 'ana@p33.test'`)).toBe(1)
  })

  it('a monitor cannot edit another monitor', async () => {
    await asPerson(ANA)
    expect(await affected(`update public.staff set name = 'Hackeado' where email = 'ben@p33.test'`)).toBe(0)
    expect(await affected(`delete from public.staff where email = 'ben@p33.test'`)).toBe(0)
  })

  it('a monitor cannot promote themself or change their own access', async () => {
    await asPerson(ANA)
    await expect(rows(`update public.staff set role = 'admin' where email = 'ana@p33.test'`)).rejects.toThrow(/staff_own_access_locked/)
    await expect(rows(`update public.staff set active = false where email = 'ana@p33.test'`)).rejects.toThrow(/staff_own_access_locked/)
    await expect(rows(`update public.staff set email = 'otro@p33.test' where email = 'ana@p33.test'`)).rejects.toThrow(/staff_field_locked/)
    await expect(rows(`update public.staff set user_id = '${ID.ben}' where email = 'ana@p33.test'`)).rejects.toThrow(/staff_field_locked/)
  })

  it('a monitor cannot add people', async () => {
    await asPerson(ANA)
    await expect(rows(`insert into public.staff (email, role) values ('amigo@p33.test', 'admin')`)).rejects.toThrow(/row-level security/)
  })

  it('the admin can add people, without linking them to an account', async () => {
    await asPerson(ADMIN)
    await rows(`insert into public.staff (email, name, role, user_id) values ('nueva@p33.test', 'Nueva', 'monitor', '${ID.stranger}')`)
    await asSuperuser()
    const [row] = await rows<{ user_id: string | null }>(`select user_id from public.staff where email = 'nueva@p33.test'`)
    expect(row.user_id).toBeNull()
  })

  it('the admin can change the role of others and deactivate them', async () => {
    await asPerson(ADMIN)
    expect(await affected(`update public.staff set role = 'admin' where email = 'ana@p33.test'`)).toBe(1)
    expect(await affected(`update public.staff set active = false where email = 'ben@p33.test'`)).toBe(1)
    await asPerson(BEN)
    expect(await count('clients')).toBe(0)
  })

  it('the admin cannot change their own role or access, nor the email or account of others', async () => {
    await asSuperuser()
    await db.exec(`update public.staff set role = 'admin' where email = 'ben@p33.test'`)
    await asPerson(ADMIN)
    await expect(rows(`update public.staff set role = 'monitor' where email = 'admin@p33.test'`)).rejects.toThrow(/staff_own_access_locked/)
    await expect(rows(`update public.staff set active = false where email = 'admin@p33.test'`)).rejects.toThrow(/staff_own_access_locked/)
    await expect(rows(`update public.staff set email = 'x@p33.test' where email = 'ana@p33.test'`)).rejects.toThrow(/staff_field_locked/)
    await expect(rows(`update public.staff set user_id = '${ID.stranger}' where email = 'ana@p33.test'`)).rejects.toThrow(/staff_field_locked/)
  })

  it('protects the last active admin, even from the database owner', async () => {
    await asSuperuser()
    await expect(db.exec(`update public.staff set role = 'monitor' where email = 'admin@p33.test'`)).rejects.toThrow(/staff_last_admin/)
    await expect(db.exec(`update public.staff set active = false where email = 'admin@p33.test'`)).rejects.toThrow(/staff_last_admin/)
    await expect(db.exec(`delete from public.staff where email = 'admin@p33.test'`)).rejects.toThrow(/staff_last_admin/)
  })

  it('an admin can demote another admin while one remains, but not the last one', async () => {
    await asSuperuser()
    await db.exec(`update public.staff set role = 'admin' where email = 'ben@p33.test'`)
    await asPerson(ADMIN)
    expect(await affected(`update public.staff set role = 'monitor' where email = 'ben@p33.test'`)).toBe(1)
    await asPerson(ADMIN)
    expect(await affected(`delete from public.staff where email = 'ben@p33.test'`)).toBe(1)
  })

  it('deleting an auth account just unlinks the staff row', async () => {
    await asSuperuser()
    await db.exec(`delete from auth.users where id = '${ID.ana}'`)
    const [row] = await rows<{ user_id: string | null; active: boolean }>(`select user_id, active from public.staff where email = 'ana@p33.test'`)
    expect(row).toEqual({ user_id: null, active: true })
  })
})
