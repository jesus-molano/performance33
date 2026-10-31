import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/data/seed'
import { formatProgramPeriod, getProgramStatus, getProgramWeekInfo, getProgressionWeek } from './program'

const TODAY = '2026-10-31'
const program = (startDate: string, endDate: string) => ({ ...createSeedData(TODAY).programs[0], startDate, endDate, weeks: 4 })

describe('getProgramStatus', () => {
  it('labels each phase', () => {
    expect(getProgramStatus(null, TODAY).label).toBe('Sin rutina')
    expect(getProgramStatus(program('2026-10-24', '2026-11-20'), TODAY).label).toBe('Semana 2 de 4')
    expect(getProgramStatus(program('2026-10-06', '2026-11-02'), TODAY).label).toBe('Caduca en 2 días')
    expect(getProgramStatus(program('2026-09-01', '2026-09-28'), TODAY).label).toBe('Caducada')
    expect(getProgramStatus(program('2026-11-01', '2026-11-28'), TODAY).label).toBe('Empieza mañana')
  })
})

describe('progression week policy', () => {
  it('applies progression only while the program is running', () => {
    expect(getProgressionWeek(getProgramWeekInfo(program('2026-10-24', '2026-11-20'), TODAY))).toBe(2)
    expect(getProgressionWeek(getProgramWeekInfo(program('2026-09-01', '2026-09-28'), TODAY))).toBeNull()
    expect(getProgressionWeek(getProgramWeekInfo(program('2026-11-05', '2026-12-02'), TODAY))).toBeNull()
  })

  it('does not claim a running week for an expired program', () => {
    const expired = program('2026-09-01', '2026-09-28')
    expect(formatProgramPeriod(getProgramWeekInfo(expired, TODAY), expired.startDate)).toBe('Rutina terminada')
  })
})
