// The routine a member's app gets (my_routine in schema.sql) must be exactly what toPublicProgram gives the TVs:
// the same fields, nothing private. Runs the SQL on a real Postgres (PGlite).

import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import SCHEMA from '../../../supabase/schema.sql?raw'
import { PGLITE_TIMEOUT_MS, SUPABASE_STUBS, sqlSession } from '../../../supabase/testHarness.ts'
import { createSeedData } from '@/data/seed'
import type { Program } from '@/types'
import { toPublicProgram } from './sanitize'

vi.setConfig({ testTimeout: PGLITE_TIMEOUT_MS, hookTimeout: PGLITE_TIMEOUT_MS })

const MEMBER_USER = '00000000-0000-4000-8000-0000000000d1'

let db: PGlite
const { asSuperuser, asPerson, rows } = sqlSession(() => db)

/** As JSON travels: what a missing field and an undefined one look like is the same. */
const asJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value))

/** A seed routine with every private field filled in, and a half-typed row the member must not see. */
function withPrivateFields(program: Program): Program {
  return {
    ...program,
    createdBy: 'profile-secreto',
    days: program.days.map((day, dayIndex) => ({
      ...day,
      blocks: day.blocks.map((block, blockIndex) => ({
        ...block,
        exercises: [
          ...block.exercises.map((exercise) => ({ ...exercise, internalNote: 'NOTA-PRIVADA' })),
          ...(dayIndex === 0 && blockIndex === 0 ? [{ ...block.exercises[0], id: 'sin-nombre', name: '   ', internalNote: 'NOTA-PRIVADA' }] : []),
        ],
      })),
    })),
  }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUBS)
  await db.exec(SCHEMA)
})

afterAll(async () => {
  await db.close()
})

describe('my_routine is toPublicProgram', () => {
  const seed = createSeedData('2026-11-02')
  const programs = seed.programs.filter((program) => program.days.some((day) => day.blocks.some((block) => block.exercises.length > 0)))

  it('gives, for every demo routine, exactly the fields of toPublicProgram', async () => {
    expect(programs.length).toBeGreaterThan(3)
    await asSuperuser()
    for (const program of programs) {
      const stored = withPrivateFields(program)
      const [{ result }] = await rows<{ result: unknown }>('select public.public_program($1, $2) as result', [stored.id, JSON.stringify(stored)])
      expect(result, program.id).toEqual(asJson(toPublicProgram(stored)))
      const text = JSON.stringify(result)
      expect(text).not.toContain('NOTA-PRIVADA')
      expect(text).not.toContain('internalNote')
      expect(text).not.toContain('profile-secreto')
    }
  })

  it('a member gets it the same way, without the goal or the notes of their file', async () => {
    const program = withPrivateFields(programs[0])
    const client = seed.clients.find((candidate) => candidate.id === program.clientId)
    await asSuperuser()
    await db.exec(`insert into auth.users (id, email) values ('${MEMBER_USER}', 'socia@p33.test')`)
    await rows('insert into public.clients (id, data) values ($1, $2)', [program.clientId, JSON.stringify({ ...client, currentProgramId: program.id, goal: 'OBJETIVO-PRIVADO' })])
    await rows('insert into public.programs (id, data) values ($1, $2)', [program.id, JSON.stringify(program)])
    await rows(`insert into public.notes (id, data, client_id) values ('n1', '{"text":"NOTA-SALUD"}', $1)`, [program.clientId])
    await rows(`insert into public.members (user_id, client_id, username) values ($1, $2, 'socia')`, [MEMBER_USER, program.clientId])
    await asPerson(MEMBER_USER)
    const [{ my_routine: routine }] = await rows<{ my_routine: { program: unknown } }>('select public.my_routine()')
    expect(routine.program).toEqual(asJson(toPublicProgram(program)))
    const text = JSON.stringify(routine)
    for (const secret of ['NOTA-PRIVADA', 'OBJETIVO-PRIVADO', 'NOTA-SALUD', 'goal', client?.lastName ?? 'lastName']) expect(text).not.toContain(secret)
  })
})
