// BroadcastChannel transport (same browser, instant). Two channels:
//   data    → full AppData, for other DASHBOARD tabs.
//   display → sanitised DisplayData (no private fields), for Pantalla / TV windows.

import { SYNC_CHANNELS } from '@/config/app'
import { toDisplayData } from '@/lib/display'
import type { AppData, DisplayData } from '@/types'
import type { ChangeMeta, DisplayChange, RemoteChange } from './repository'

interface ChannelMessage<T> extends ChangeMeta {
  data: T
}

const channels = new Map<string, BroadcastChannel>()

function getChannel(name: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  let channel = channels.get(name)
  if (!channel) {
    channel = new BroadcastChannel(name)
    channels.set(name, channel)
  }
  return channel
}

function post<T>(name: string, message: ChannelMessage<T>): void {
  try {
    getChannel(name)?.postMessage(message)
  } catch {
    // Channel closed or data not cloneable: the storage event is the fallback.
  }
}

function listen<T>(name: string, listener: (message: ChannelMessage<T>) => void): () => void {
  const channel = getChannel(name)
  if (!channel) return () => undefined
  const onMessage = (event: MessageEvent<ChannelMessage<T>>) => listener(event.data)
  channel.addEventListener('message', onMessage)
  return () => channel.removeEventListener('message', onMessage)
}

/** Sends a local change: full data to dashboards, sanitised data to display windows. */
export function broadcastChange(data: AppData, meta: ChangeMeta): void {
  post<AppData>(SYNC_CHANNELS.data, { ...meta, data })
  post<DisplayData>(SYNC_CHANNELS.display, { ...meta, data: toDisplayData(data) })
}

export function listenDataChannel(listener: (change: RemoteChange) => void): () => void {
  return listen<AppData>(SYNC_CHANNELS.data, listener)
}

export function listenDisplayChannel(listener: (change: DisplayChange) => void): () => void {
  return listen<DisplayData>(SYNC_CHANNELS.display, listener)
}
