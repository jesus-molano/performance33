import { useCallback, useEffect, useState } from 'react'
import { auth } from '@/auth'
import type { SignInMethods } from '@/auth'
import { useToast } from '@/hooks'
import { TEAM_COPY } from '@/features/team/config'

export interface GoogleConnectionApi {
  /** null while it is being checked, or if it could not be. */
  methods: SignInMethods | null
  busy: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

/** 'Mi perfil' → Google. Connecting leaves for Google and comes back to the app. */
export function useGoogleConnection(hasOwnPassword: boolean): GoogleConnectionApi {
  const { toast } = useToast()
  const [methods, setMethods] = useState<SignInMethods | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    auth.getSignInMethods(hasOwnPassword).then(
      (loaded) => {
        if (live) setMethods(loaded)
      },
      () => undefined,
    )
    return () => {
      live = false
    }
  }, [hasOwnPassword])

  const run = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true)
      try {
        await action()
      } catch (error) {
        toast({ message: error instanceof Error ? error.message : TEAM_COPY.saveFailed, tone: 'error' })
      } finally {
        setBusy(false)
      }
    },
    [toast],
  )

  return {
    methods,
    busy,
    connect: () => run(() => auth.connectGoogle()),
    disconnect: () =>
      run(async () => {
        await auth.disconnectGoogle()
        setMethods(await auth.getSignInMethods(hasOwnPassword))
        toast({ message: TEAM_COPY.googleDisconnected, tone: 'success' })
      }),
  }
}
