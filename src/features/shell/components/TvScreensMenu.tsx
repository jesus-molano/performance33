import { MonitorPlay } from 'lucide-react'
import { TV_LAUNCHER } from '@/features/shell/config'
import { usePopover } from '@/features/shell/hooks/usePopover'
import { SidebarAction } from './SidebarLink'
import { TvScreensList } from './TvScreensList'

/** 'Pantallas' in the sidebar: a small menu with one entry per TV. */
export function TvScreensMenu() {
  const { isOpen, toggle, close, rootRef } = usePopover()

  return (
    <div ref={rootRef} className="relative">
      <SidebarAction icon={MonitorPlay} label={TV_LAUNCHER.label} expanded={isOpen} onClick={toggle} />
      {isOpen && (
        <div className="absolute top-full left-0 z-40 mt-1 max-h-[calc(100dvh-12rem)] w-80 origin-top-left animate-pop-in overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
          <TvScreensList onDone={close} />
        </div>
      )}
    </div>
  )
}
