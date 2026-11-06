// Which TV windows are open, over Realtime Presence: each window joins with its tab id and, while it shows a screen,
// says which. Only screen numbers travel. The channel lives as long as the page: its topic is shared by every window,
// and asking again for a topic that is still being removed would get the dying channel.

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { SCREENS_PRESENCE_TOPIC } from '@/features/screens/config/screens'
import { isValidScreenId } from '@/features/screens/utils/sections'
import { TAB_ID } from '@/persistence/tabId'
import type { ScreenPresence } from './types'

interface PresencePayload {
  screens?: unknown
}

/** Screens named by everyone present (anything that is not a screen number is ignored). */
export function onlineScreens(state: Record<string, PresencePayload[]>): ReadonlySet<number> {
  const screens = Object.values(state)
    .flat()
    .flatMap((meta) => (Array.isArray(meta.screens) ? meta.screens : []))
    .filter((screen): screen is number => typeof screen === 'number' && isValidScreenId(screen))
  return new Set(screens)
}

export function createCloudPresence(client: SupabaseClient): ScreenPresence {
  const tracked = new Map<number, number>()
  const listeners = new Set<(online: ReadonlySet<number>) => void>()
  let online: ReadonlySet<number> = new Set()
  let channel: RealtimeChannel | null = null
  let joined = false

  const sendTracked = () => {
    if (!channel || !joined) return
    const screens = [...tracked.keys()]
    void (screens.length ? channel.track({ screens }) : channel.untrack())
  }

  const join = () => {
    if (channel) return
    channel = client.channel(SCREENS_PRESENCE_TOPIC, { config: { presence: { key: TAB_ID } } })
    channel.on('presence', { event: 'sync' }, () => {
      if (!channel) return
      online = onlineScreens(channel.presenceState<PresencePayload>())
      listeners.forEach((listener) => listener(online))
    })
    // Joining again after a lost connection forgets what was tracked: say it again each time.
    channel.subscribe((status) => {
      joined = status === 'SUBSCRIBED'
      sendTracked()
    })
  }

  return {
    track(screen) {
      join()
      tracked.set(screen, (tracked.get(screen) ?? 0) + 1)
      sendTracked()
      return () => {
        const left = (tracked.get(screen) ?? 1) - 1
        if (left > 0) tracked.set(screen, left)
        else tracked.delete(screen)
        sendTracked()
      }
    },

    watch(listener) {
      join()
      listeners.add(listener)
      listener(online)
      return () => listeners.delete(listener)
    },
  }
}
