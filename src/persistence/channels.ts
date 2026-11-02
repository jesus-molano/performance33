// BroadcastChannel transport (same browser, instant). Two channels:
//   data    → full AppData, for other DASHBOARD tabs (local test mode only; in the cloud each tab syncs with the server).
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

export function broadcastDisplay(data: DisplayData, meta: ChangeMeta): void {
  post<DisplayData>(SYNC_CHANNELS.display, { ...meta, data })
}

/** Sends a local change to display windows and, when `shareFullData`, to other dashboards. */
export function broadcastChange(data: AppData, meta: ChangeMeta, shareFullData: boolean): void {
  if (shareFullData) post<AppData>(SYNC_CHANNELS.data, { ...meta, data })
  broadcastDisplay(toDisplayData(data), meta)
}

export function listenDataChannel(listener: (change: RemoteChange) => void): () => void {
  return listen<AppData>(SYNC_CHANNELS.data, (message) => listener({ ...message, kind: 'snapshot' }))
}

export function listenDisplayChannel(listener: (change: DisplayChange) => void): () => void {
  return listen<DisplayData>(SYNC_CHANNELS.display, listener)
}
