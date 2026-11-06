import { LoaderCircle, MonitorOff, WifiOff } from 'lucide-react'
import type { Branding } from '@/types'
import { TV_STATE_TEXTS } from '@/features/display/config/tv'
import type { TvWindowState } from '@/features/display/utils/tvScreens'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { ScreenMessage } from '@/features/display/components/screen/ScreenMessage'

interface TvWindowStatusProps {
  state: TvWindowState
  branding: Branding
  theme: DisplayThemeClasses
}

const STATES = {
  loading: { icon: LoaderCircle, title: TV_STATE_TEXTS.loading, description: undefined },
  retrying: { icon: WifiOff, title: TV_STATE_TEXTS.retrying, description: undefined },
  removed: { icon: MonitorOff, title: TV_STATE_TEXTS.removedTitle, description: TV_STATE_TEXTS.removedHint },
} as const

/** What a TV window shows instead of its sections: still loading, no connection yet, or the screen was removed. */
export function TvWindowStatus({ state, branding, theme }: TvWindowStatusProps) {
  const { icon, title, description } = STATES[state]
  return <ScreenMessage branding={branding} theme={theme} icon={icon} title={title} description={description} />
}
