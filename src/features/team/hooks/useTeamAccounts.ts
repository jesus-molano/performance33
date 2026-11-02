import { useEffect, useMemo, useState } from 'react'
import { teamService } from '@/auth'
import { useTeam } from '@/store'
import type { Profile } from '@/types'
import { sortAccounts } from '@/features/team/utils/accountForm'

export interface TeamAccountsApi {
  accounts: Profile[]
  loadFailed: boolean
}

/** Everyone's access data, for administrators. Follows the live team list: any change there reloads it. */
export function useTeamAccounts(): TeamAccountsApi {
  const team = useTeam()
  const [accounts, setAccounts] = useState<Profile[]>([])
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let live = true
    teamService.listAccounts().then(
      (loaded) => {
        if (!live) return
        setAccounts(loaded)
        setLoadFailed(false)
      },
      () => {
        if (live) setLoadFailed(true)
      },
    )
    return () => {
      live = false
    }
  }, [team])

  return { accounts: useMemo(() => sortAccounts(accounts), [accounts]), loadFailed }
}
