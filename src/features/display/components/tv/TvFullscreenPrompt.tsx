import { Maximize } from 'lucide-react'
import { TV_FULLSCREEN_COPY } from '@/config/screenDetection'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface TvFullscreenPromptProps {
  theme: DisplayThemeClasses
  onFullscreen: () => void
  onDismiss: () => void
}

/** Bar at the foot of a TV window that just opened, over the bottom edge only: one click and the routine fills the TV. */
export function TvFullscreenPrompt({ theme, onFullscreen, onDismiss }: TvFullscreenPromptProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-6" onDoubleClick={(event) => event.stopPropagation()}>
      <div className={cn('pointer-events-auto flex items-center gap-5 rounded-3xl py-3 pr-4 pl-3 shadow-pop', theme.overlay)}>
        <button
          type="button"
          onClick={onFullscreen}
          className={cn('inline-flex min-h-16 items-center gap-3 rounded-2xl px-7 text-3xl font-bold transition-transform hover:scale-[1.02]', theme.badge)}
        >
          <Maximize size={32} aria-hidden />
          {TV_FULLSCREEN_COPY.button}
        </button>
        <p className="max-w-sm text-xl font-medium">{TV_FULLSCREEN_COPY.hint}</p>
        <button type="button" onClick={onDismiss} className="min-h-12 rounded-full px-4 text-xl font-semibold underline-offset-4 hover:underline">
          {TV_FULLSCREEN_COPY.later}
        </button>
      </div>
    </div>
  )
}
