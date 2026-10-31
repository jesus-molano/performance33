import { useMemo } from 'react'
import { getProgramWeekInfo } from '../../../lib/program'
import type { Program } from '../../../types'
import type { WeekContext } from '../types'

/** Total weeks and the running week (null before it starts or after it ends). */
export function useWeekContext(program: Pick<Program, 'startDate' | 'endDate' | 'weeks'>): WeekContext {
  const { startDate, endDate, weeks } = program
  return useMemo(() => {
    const info = getProgramWeekInfo({ startDate, endDate, weeks })
    return { total: info.totalWeeks, current: info.phase === 'active' ? info.week : null }
  }, [startDate, endDate, weeks])
}
