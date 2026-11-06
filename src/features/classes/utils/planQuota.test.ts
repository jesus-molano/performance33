import { BOOKING_DEFAULTS } from '@shared/booking'
import { describe, expect, it } from 'vitest'
import { planDescriptions, planQuotaText, quotaChoiceOf, quotaOptions, quotaRuleOf, withCurrent } from './planQuota'

describe('plan quotas', () => {
  it('describes each plan from the rules', () => {
    expect(planQuotaText(1)).toBe('1 clase/semana')
    expect(planDescriptions(BOOKING_DEFAULTS)).toEqual({
      standard: '2 clases/semana',
      plus: '3 clases/semana',
      elite: 'Clases sin límite',
      custom: 'Clases según sus días',
    })
  })

  it('round-trips the choices of the select', () => {
    for (const rule of [3, 'unlimited', 'training_days'] as const) expect(quotaRuleOf(quotaChoiceOf(rule))).toBe(rule)
    const options = quotaOptions(2)
    expect(options.map((o) => o.value)).toEqual(['1', '2', '3', '4', '5', '6', '7', 'unlimited', 'training_days'])
    expect(options[0].label).toBe('1 clase')
    expect(quotaOptions(9).map((o) => o.value)).toContain('9')
  })

  it('adds a saved value outside the presets', () => {
    expect(withCurrent([0, 30, 60], 45)).toEqual([0, 30, 45, 60])
    expect(withCurrent([0, 30, 60], 30)).toEqual([0, 30, 60])
  })
})
