import { UserX } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ClientOption } from '@/features/display/utils/clientOptions'
import { TV_PICKER_TEXTS } from '@/features/display/config/tv'

interface ClientComboboxOptionProps {
  id: string
  index: number
  /** null = 'Sin usuario'. */
  option: ClientOption | null
  active: boolean
  selected: boolean
  onPick: () => void
  onHover: () => void
}

/** One listbox row: colour dot + first name (+ 'Sin rutina' tag), or the 'Sin usuario' entry. */
export function ClientComboboxOption({ id, index, option, active, selected, onPick, onHover }: ClientComboboxOptionProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected}
      data-index={index}
      // Keep focus in the input so the list does not close before the click lands.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      onMouseMove={onHover}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-base',
        active && 'bg-current/15',
        selected && 'font-semibold',
      )}
    >
      {option ? (
        <>
          <span aria-hidden className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: option.client.color }} />
          <span className="min-w-0 flex-1 truncate">{option.label}</span>
          {!option.hasRoutine && (
            <span className="shrink-0 rounded-full border border-current/25 px-2 py-0.5 text-xs opacity-70">
              {TV_PICKER_TEXTS.noRoutine}
            </span>
          )}
        </>
      ) : (
        <>
          <UserX size={16} aria-hidden className="shrink-0 opacity-70" />
          <span className="flex-1 opacity-80">{TV_PICKER_TEXTS.noClient}</span>
        </>
      )}
    </li>
  )
}
