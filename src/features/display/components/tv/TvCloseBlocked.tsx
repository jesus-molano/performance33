import { X } from 'lucide-react'
import { TV_CLOSE_BLOCKED_COPY } from '@/config/screenDetection'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface TvCloseBlockedProps {
  theme: DisplayThemeClasses
  onKeep: () => void
}

/** 'Cerrar todas' reached a window the browser will not let close itself: say how to close it, big enough to read. */
export function TvCloseBlocked({ theme, onKeep }: TvCloseBlockedProps) {
  return (
    <div role="alertdialog" aria-labelledby="tv-close-blocked-title" className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-8">
      <div className={cn('flex max-w-2xl flex-col items-center gap-5 rounded-3xl p-10 text-center shadow-pop', theme.overlay)}>
        <X size={56} aria-hidden />
        <h2 id="tv-close-blocked-title" className="text-4xl font-bold">
          {TV_CLOSE_BLOCKED_COPY.title}
        </h2>
        <p className="text-2xl">{TV_CLOSE_BLOCKED_COPY.body}</p>
        <button type="button" onClick={onKeep} className={cn('min-h-14 rounded-2xl px-6 text-xl font-semibold', theme.badge)}>
          {TV_CLOSE_BLOCKED_COPY.keep}
        </button>
      </div>
    </div>
  )
}
