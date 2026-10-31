import { PLAN_BY_ID } from '@/config/plans'
import { pickColor } from '@/lib/color'
import { isValidISODate, todayISO } from '@/lib/dates'
import type { Client, ClientPatch, ISODate, PlanId } from '@/types'

export interface ClientFormValues {
  firstName: string
  lastName: string
  plan: PlanId
  trainingDays: number
  startDate: ISODate
  goal: string
  color: string
}

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>

const DEFAULT_PLAN: PlanId = 'plus'

export function toClientFormValues(client: Client | null): ClientFormValues {
  if (client) {
    const { firstName, lastName, plan, trainingDays, startDate, goal, color } = client
    return { firstName, lastName, plan, trainingDays, startDate, goal, color }
  }
  return {
    firstName: '',
    lastName: '',
    plan: DEFAULT_PLAN,
    trainingDays: PLAN_BY_ID[DEFAULT_PLAN].defaultDays,
    startDate: todayISO(),
    goal: '',
    color: pickColor(String(Date.now())),
  }
}

export function validateClientForm(values: ClientFormValues): ClientFormErrors {
  const errors: ClientFormErrors = {}
  if (!values.firstName.trim()) errors.firstName = 'Escribe al menos el nombre.'
  if (!isValidISODate(values.startDate)) errors.startDate = 'Elige una fecha válida.'
  return errors
}

/** Trimmed values ready for addClient / updateClient. */
export function toClientPatch(values: ClientFormValues): ClientPatch & { firstName: string } {
  return {
    ...values,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    goal: values.goal.trim(),
  }
}
