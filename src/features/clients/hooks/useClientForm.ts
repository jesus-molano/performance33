import { useState, type FormEvent } from 'react'
import { PLAN_BY_ID } from '@/config/plans'
import { useToast } from '@/hooks'
import { navigate, paths } from '@/lib/routes'
import { useAppActions } from '@/store'
import type { Client, PlanId } from '@/types'
import { toClientFormValues, toClientPatch, validateClientForm, type ClientFormErrors, type ClientFormValues } from '@/features/clients/utils/clientForm'

export interface ClientFormApi {
  isEdit: boolean
  values: ClientFormValues
  errors: ClientFormErrors
  setField: <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => void
  /** Changing plan also suggests its default training days. */
  setPlan: (plan: PlanId) => void
  submit: (event: FormEvent) => void
}

/** Add / edit client form. A new client opens their page right away. */
export function useClientForm(client: Client | null, onDone: () => void): ClientFormApi {
  const { addClient, updateClient } = useAppActions()
  const { toast } = useToast()
  const [values, setValues] = useState(() => toClientFormValues(client))
  const [submitted, setSubmitted] = useState(false)
  const allErrors = validateClientForm(values)

  const setField: ClientFormApi['setField'] = (key, value) => setValues((v) => ({ ...v, [key]: value }))
  const setPlan = (plan: PlanId) => setValues((v) => ({ ...v, plan, trainingDays: PLAN_BY_ID[plan].defaultDays }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(allErrors).length > 0) return
    const patch = toClientPatch(values)
    if (client) {
      updateClient(client.id, patch)
      toast({ message: 'Datos guardados', tone: 'success' })
    } else {
      const id = addClient(patch)
      toast({ message: `${patch.firstName} añadido. Ahora créale su rutina.`, tone: 'success' })
      navigate(paths.client(id))
    }
    onDone()
  }

  return { isEdit: client !== null, values, errors: submitted ? allErrors : {}, setField, setPlan, submit }
}
