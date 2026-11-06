import { useState } from 'react'
import { useConfirm, useToast } from '@/hooks'
import type { Client } from '@/types'
import { MEMBER_ACTION_COPY } from '@/features/members/config/copy'
import { memberAccessService } from '@/features/members/services/instance'
import type { GiveAccessInput, MemberAccess, MemberAccessStatus, MemberCredentials } from '@/features/members/types'
import { memberAccessStatus } from '@/features/members/utils/access'
import { useMemberAccess } from './useMemberAccess'

export interface MemberAccessCardApi {
  loadStatus: 'loading' | 'ready' | 'error'
  access: MemberAccess | null
  status: MemberAccessStatus | null
  busy: boolean
  retry: () => void
  giving: boolean
  openGive: () => void
  closeGive: () => void
  /** Rejects with the message to show in the form. */
  give: (input: GiveAccessInput) => Promise<void>
  /** Shown once, then gone. */
  credentials: MemberCredentials | null
  closeCredentials: () => void
  resetPassword: () => Promise<void>
  setActive: (active: boolean) => Promise<void>
  remove: () => Promise<void>
}

/** "Acceso a la app" on the user's page: any coach gives it and looks after it. */
export function useMemberAccessCard(client: Client): MemberAccessCardApi {
  const { status: loadStatus, access, checkedAt, reload } = useMemberAccess(client.id)
  const confirm = useConfirm()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [giving, setGiving] = useState(false)
  const [credentials, setCredentials] = useState<MemberCredentials | null>(null)
  const name = client.firstName

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : MEMBER_ACTION_COPY.failed, tone: 'error' })
    } finally {
      setBusy(false)
      reload()
    }
  }

  const give = async (input: GiveAccessInput) => {
    setBusy(true)
    try {
      setCredentials(await memberAccessService.give(client.id, input))
      setGiving(false)
    } finally {
      setBusy(false)
      reload()
    }
  }

  const resetPassword = async () => {
    const ok = await confirm({ title: MEMBER_ACTION_COPY.resetTitle(name), description: MEMBER_ACTION_COPY.resetBody, confirmLabel: MEMBER_ACTION_COPY.resetConfirm })
    if (ok) await run(async () => setCredentials(await memberAccessService.resetPassword(client.id)))
  }

  const setActive = async (active: boolean) => {
    if (!active) {
      const ok = await confirm({ title: MEMBER_ACTION_COPY.pauseTitle(name), description: MEMBER_ACTION_COPY.pauseBody, confirmLabel: MEMBER_ACTION_COPY.pauseConfirm })
      if (!ok) return
    }
    await run(async () => {
      await memberAccessService.setActive(client.id, active)
      toast({ message: active ? MEMBER_ACTION_COPY.resumed(name) : MEMBER_ACTION_COPY.paused(name), tone: 'success' })
    })
  }

  const remove = async () => {
    const ok = await confirm({ title: MEMBER_ACTION_COPY.removeTitle(name), description: MEMBER_ACTION_COPY.removeBody, confirmLabel: MEMBER_ACTION_COPY.removeConfirm, danger: true })
    if (!ok) return
    await run(async () => {
      await memberAccessService.remove(client.id)
      toast({ message: MEMBER_ACTION_COPY.removed(name), tone: 'success' })
    })
  }

  return {
    loadStatus,
    access,
    status: access ? memberAccessStatus(access, checkedAt) : null,
    busy,
    retry: reload,
    giving,
    openGive: () => setGiving(true),
    closeGive: () => setGiving(false),
    give,
    credentials,
    closeCredentials: () => setCredentials(null),
    resetPassword,
    setActive,
    remove,
  }
}
