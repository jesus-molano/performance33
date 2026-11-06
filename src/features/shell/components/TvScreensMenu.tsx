import { MonitorPlay } from 'lucide-react'
import { useDisclosure, usePhoneScreen } from '@/hooks'
import { TV_LAUNCHER } from '@/features/shell/config'
import { useCloseOnPhoneChange } from '@/features/shell/hooks/useCloseOnPhoneChange'
import { usePopover } from '@/features/shell/hooks/usePopover'
import { ScreensRemoteSheet } from './remote/ScreensRemoteSheet'
import { SidebarAction } from './SidebarLink'
import { TvScreensList } from './TvScreensList'

/** 'Pantallas' in the sidebar: a small menu with one entry per TV; on a phone held sideways, the remote control. */
export function TvScreensMenu() {
  const { isOpen, toggle, close, rootRef } = usePopover()
  const remote = useDisclosure()
  const phone = usePhoneScreen()
  useCloseOnPhoneChange(phone, close)
  useCloseOnPhoneChange(phone, remote.close)

  return (
    <div ref={rootRef} className="relative">
      <SidebarAction icon={MonitorPlay} label={TV_LAUNCHER.label} expanded={phone ? remote.isOpen : isOpen} onClick={phone ? remote.open : toggle} />
      {isOpen && !phone && (
        <div className="absolute top-full left-0 z-40 mt-1 max-h-[calc(100dvh-12rem)] w-80 origin-top-left animate-pop-in overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
          <TvScreensList onDone={close} />
        </div>
      )}
      <ScreensRemoteSheet open={phone && remote.isOpen} onClose={remote.close} />
    </div>
  )
}
