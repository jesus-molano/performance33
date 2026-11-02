import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { deepEqual } from '@/lib/deepEqual'
import { DOMAIN_TABLES, toRowSet } from '@/lib/dataRows'
import { useAppStore } from '@/store'
import type { AppData } from '@/types'
import { rowFromDb, rowToDb } from './dbRows'

/** What the server gives back for what we saved: JSON keeps no `undefined`, and every read normalises. */
function expectRoundTrip(data: AppData) {
  const rows = toRowSet(data)
  for (const table of DOMAIN_TABLES) {
    for (const [id, row] of rows[table]) {
      const stored = JSON.parse(JSON.stringify(rowToDb({ table, id, row } as never, 'origin')))
      expect(deepEqual(rowFromDb(table, stored), row), `${table}:${id}`).toBe(true)
    }
  }
}

describe('rows read back from the server equal what was saved', () => {
  const store = () => useAppStore.getState()

  it('for the demo data', () => {
    expectRoundTrip(createSeedData('2026-10-31'))
  })

  it('after the editing that clears or empties things', () => {
    useAppStore.setState({ data: createSeedData('2026-10-31') })
    const program = store().data.programs.find((p) => p.days.length > 1 && p.days[0].blocks.length > 0)
    if (!program) throw new Error('missing program')
    const [day] = program.days
    const blockId = store().addBlock(day.id, 'superset', { withExercise: true })
    store().updateBlockParams(blockId, { restBetweenRoundsSec: undefined })
    store().updateDay(day.id, { name: '' })
    store().updateDay(program.days[1].id, { name: 'Día 7', label: '' })
    const exerciseId = store().data.programs.find((p) => p.id === program.id)?.days[0].blocks.at(-1)?.exercises[0].id ?? ''
    store().updateExercise(exerciseId, { sets: null, restSec: null, load: '', cue: '', progression: null })
    store().updateBranding({ logoUrl: '' })
    const [withLink, withoutLink] = store().data.library
    store().updateLibraryExercise(withLink.id, { link: 'https://youtu.be/abc' })
    store().updateLibraryExercise(withoutLink.id, { link: 'https://youtu.be/def' })
    store().updateLibraryExercise(withoutLink.id, { link: '' })
    expectRoundTrip(store().data)
  })
})
