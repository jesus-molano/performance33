/** Program weeks as needed by exercise rows (progression strip S1..SN). */
export interface WeekContext {
  total: number
  /** 1-based current week while the program is running, else null. */
  current: number | null
}
