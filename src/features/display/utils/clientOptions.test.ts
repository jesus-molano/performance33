import { describe, expect, it } from 'vitest'
import { DEFAULT_BRANDING } from '@/config/branding'
import type { DisplayData, PublicClient, PublicProgram } from '@/types'
import { buildClientOptions, filterClientOptions } from './clientOptions'

const client = (id: string, firstName: string, lastInitial: string, extra: Partial<PublicClient> = {}): PublicClient => ({
  id,
  firstName,
  lastInitial,
  color: '#000000',
  archived: false,
  currentProgramId: null,
  ...extra,
})

const program: PublicProgram = {
  id: 'p1',
  clientId: 'laura',
  name: '',
  startDate: '2026-10-01',
  endDate: '2026-10-28',
  weeks: 4,
  createdAt: '',
  days: [],
}

const data: DisplayData = {
  branding: DEFAULT_BRANDING,
  programs: [program],
  clients: [
    client('laura', 'Laura', 'M', { currentProgramId: 'p1' }),
    client('laura2', 'laura', 'R'),
    client('andres', 'Andrés', 'N'),
    client('sergio', 'Sergio', 'R', { archived: true }),
    client('lucia', 'Lucía', 'Á'),
  ],
}

const labels = (query: string) => filterClientOptions(buildClientOptions(data, null), query).map((o) => o.label)

describe('buildClientOptions', () => {
  it('lists active clients by first name and marks those without a routine', () => {
    const options = buildClientOptions(data, null)
    expect(options.map((o) => o.label)).toEqual(['Andrés', 'Laura M.', 'laura R.', 'Lucía'])
    expect(options.map((o) => o.hasRoutine)).toEqual([false, true, false, false])
  })

  it('adds the surname initial only when a first name is shared', () => {
    const single = { ...data, clients: [data.clients[0], data.clients[2]] }
    expect(buildClientOptions(single, null).map((o) => o.label)).toEqual(['Andrés', 'Laura'])
  })

  it('keeps the selected client even if archived', () => {
    expect(buildClientOptions(data, 'sergio').map((o) => o.client.id)).toContain('sergio')
  })

  it('is empty without data', () => {
    expect(buildClientOptions(null, null)).toEqual([])
  })
})

describe('filterClientOptions', () => {
  it('matches the label, ignoring accents and case', () => {
    expect(labels('ANDRES')).toEqual(['Andrés'])
    expect(labels('lucia')).toEqual(['Lucía'])
  })

  it('needs every typed word to match', () => {
    expect(labels('lau m')).toEqual(['Laura M.'])
    expect(labels('lau')).toEqual(['Laura M.', 'laura R.'])
    expect(labels('laura x')).toEqual([])
  })

  it('returns everything for an empty query', () => {
    expect(labels('  ')).toHaveLength(4)
  })
})
