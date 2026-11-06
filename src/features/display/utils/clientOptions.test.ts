import { describe, expect, it } from 'vitest'
import { DEFAULT_BRANDING } from '@/config/branding'
import type { DisplayData, PublicClient, PublicProgram } from '@/types'
import { buildClientOptions, filterClientOptions, shownClientId } from './clientOptions'

const client = (id: string, firstName: string, lastName: string, extra: Partial<PublicClient> = {}): PublicClient => ({
  id,
  firstName,
  lastName,
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
    client('laura', 'Laura', 'Martín', { currentProgramId: 'p1' }),
    client('laura2', 'laura', 'Ruiz'),
    client('andres', 'Andrés', 'Núñez'),
    client('sergio', 'Sergio', 'Ramos', { archived: true }),
    client('lucia', 'Lucía', 'Álvarez'),
  ],
}

const labels = (query: string) => filterClientOptions(buildClientOptions(data), query).map((o) => o.label)

describe('buildClientOptions', () => {
  it('lists active clients by full name and marks those without a routine', () => {
    const options = buildClientOptions(data)
    expect(options.map((o) => o.label)).toEqual(['Andrés Núñez', 'Laura Martín', 'laura Ruiz', 'Lucía Álvarez'])
    expect(options.map((o) => o.hasRoutine)).toEqual([false, true, false, false])
  })

  it('omits the trailing space when there is no surname', () => {
    const single = { ...data, clients: [client('ana', 'Ana', '')] }
    expect(buildClientOptions(single).map((o) => o.label)).toEqual(['Ana'])
  })

  it('never offers an archived client', () => {
    expect(buildClientOptions(data).map((o) => o.client.id)).not.toContain('sergio')
  })

  it('is empty without data', () => {
    expect(buildClientOptions(null)).toEqual([])
  })
})

describe('filterClientOptions', () => {
  it('matches first name or surname, ignoring accents and case', () => {
    expect(labels('ANDRES')).toEqual(['Andrés Núñez'])
    expect(labels('alvarez')).toEqual(['Lucía Álvarez'])
  })

  it('needs every typed word to match', () => {
    expect(labels('lau mar')).toEqual(['Laura Martín'])
    expect(labels('lau')).toEqual(['Laura Martín', 'laura Ruiz'])
    expect(labels('laura x')).toEqual([])
  })

  it('returns everything for an empty query', () => {
    expect(labels('  ')).toHaveLength(4)
  })
})

describe('shownClientId', () => {
  it('shows an archived client as nobody, and keeps active or unknown ids', () => {
    expect(shownClientId(data, 'sergio')).toBeNull()
    expect(shownClientId(data, 'laura')).toBe('laura')
    expect(shownClientId(data, 'gone')).toBe('gone')
    expect(shownClientId(null, 'sergio')).toBe('sergio')
    expect(shownClientId(data, null)).toBeNull()
  })
})
