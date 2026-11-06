// BroadcastChannel transport (same browser, instant). Two channels:
//   data    → full AppData, for other DASHBOARD tabs (local test mode only; in the cloud each tab syncs with the server).
//   display → sanitised DisplayData (no private fields), for Pantalla / TV windows.
// And tvScreens: which named TV windows are open, and the order to close one; tvControl: orders to all TV windows
// (bring them to the laptop, close them, put one back on its TV). No client data.

import { SYNC_CHANNELS } from '@/config/app'
import { toDisplayData } from '@/lib/display'
import { parseTvControlMessage, type TvControlMessage } from '@/lib/tvControl'
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

function post(name: string, message: unknown): void {
  try {
    getChannel(name)?.postMessage(message)
  } catch {
    // Channel closed or data not cloneable: the storage event is the fallback.
  }
}

function listen<M>(name: string, listener: (message: M) => void): () => void {
  const channel = getChannel(name)
  if (!channel) return () => undefined
  const onMessage = (event: MessageEvent<M>) => listener(event.data)
  channel.addEventListener('message', onMessage)
  return () => channel.removeEventListener('message', onMessage)
}

export function broadcastDisplay(data: DisplayData, meta: ChangeMeta): void {
  post(SYNC_CHANNELS.display, { ...meta, data } satisfies ChannelMessage<DisplayData>)
}

/** Sends a local change to display windows and, when `shareFullData`, to other dashboards. */
export function broadcastChange(data: AppData, meta: ChangeMeta, shareFullData: boolean): void {
  if (shareFullData) post(SYNC_CHANNELS.data, { ...meta, data } satisfies ChannelMessage<AppData>)
  broadcastDisplay(toDisplayData(data), meta)
}

export function listenDataChannel(listener: (change: RemoteChange) => void): () => void {
  return listen<ChannelMessage<AppData>>(SYNC_CHANNELS.data, (message) => listener({ ...message, kind: 'snapshot' }))
}

export function listenDisplayChannel(listener: (change: DisplayChange) => void): () => void {
  return listen<ChannelMessage<DisplayData>>(SYNC_CHANNELS.display, listener)
}

/** ask: who is open? · open/closed: a TV window reports itself · close: that window must close. */
export type TvScreenMessage = { type: 'ask' } | { type: 'open' | 'closed' | 'close'; screen: number }

export function broadcastTvScreen(message: TvScreenMessage): void {
  post(SYNC_CHANNELS.tvScreens, message)
}

export function listenTvScreens(listener: (message: TvScreenMessage) => void): () => void {
  return listen<TvScreenMessage>(SYNC_CHANNELS.tvScreens, listener)
}

/** Orders to every TV window of this browser (see lib/tvControl): they hear it even after the dashboard was reloaded. */
export function broadcastTvControl(message: TvControlMessage): void {
  post(SYNC_CHANNELS.tvControl, message)
}

export function listenTvControl(listener: (message: TvControlMessage) => void): () => void {
  return listen<unknown>(SYNC_CHANNELS.tvControl, (data) => {
    const message = parseTvControlMessage(data)
    if (message) listener(message)
  })
}
