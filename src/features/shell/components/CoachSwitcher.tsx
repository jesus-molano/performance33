import { ChevronDown } from 'lucide-react'
import { Avatar } from '../../../components/ui'
import type { Coach } from '../../../types'
import { useCoachSwitcher } from '../hooks/useCoachSwitcher'
import { usePopover } from '../hooks/usePopover'
import { CoachMenu } from './CoachMenu'

/** Header button with the current coach; opens a menu to switch coach. */
export function CoachSwitcher() {
  const { current, coaches, switchTo, manageCoaches, showPicker } = useCoachSwitcher()
  const { isOpen, toggle, close, rootRef } = usePopover()
  const runAndClose = (action: () => void) => () => {
    close()
    action()
  }

  if (!current) return null
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Monitor actual: ${current.name}. Cambiar de monitor`}
        className="flex h-11 items-center gap-2 rounded-xl pr-2 pl-1 hover:bg-fg/5 sm:pr-3"
      >
        <Avatar firstName={current.name} color={current.color} size="sm" />
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-[11px] text-fg-subtle">Estás como</span>
          <span className="text-sm font-semibold text-fg">{current.name}</span>
        </span>
        <ChevronDown size={16} aria-hidden className="text-fg-subtle" />
      </button>
      {isOpen && (
        <CoachMenu
          coaches={coaches}
          currentId={current.id}
          onSwitch={(coach: Coach) => {
            close()
            switchTo(coach)
          }}
          onManage={runAndClose(manageCoaches)}
          onShowPicker={runAndClose(showPicker)}
        />
      )}
    </div>
  )
}
