import { MonitorUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { FadingOverlay } from './FadingOverlay'

interface WindowHintProps {
  visible: boolean
  theme: DisplayThemeClasses
  /** Extra tip, e.g. '← → cambia de día'. */
  extra?: string
}

/** One-off tip shown when the window opens: how to put it on the ceiling TV. */
export function WindowHint({ visible, theme, extra }: WindowHintProps) {
  return (
    <FadingOverlay visible={visible} position="inset-x-0 top-4 justify-center">
      <p className={cn('flex max-w-xl items-center gap-3 rounded-2xl px-4 py-3 text-sm leading-snug shadow-pop', theme.overlay)}>
        <MonitorUp size={20} aria-hidden className={cn('shrink-0', theme.accentText)} />
        <span>
          <strong className="font-semibold">Arrastra esta ventana a la tele</strong> · F11 o doble clic para pantalla
          completa{extra ? ` · ${extra}` : ''}
        </span>
      </p>
    </FadingOverlay>
  )
}
