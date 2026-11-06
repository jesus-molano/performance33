import { Maximize } from 'lucide-react'
import { TV_FULLSCREEN_COPY } from '@/config/screenDetection'
import { cn } from '@/lib/cn'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface TvFullscreenPromptProps {
  theme: DisplayThemeClasses
  onFullscreen: () => void
  onDismiss: () => void
}

/** Big button in the middle of a TV window that just opened: one click and the routine fills the TV. */
export function TvFullscreenPrompt({ theme, onFullscreen, onDismiss }: TvFullscreenPromptProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6" onDoubleClick={(event) => event.stopPropagation()}>
      <div className={cn('flex max-w-xl flex-col items-center gap-4 rounded-3xl px-8 py-7 text-center', theme.overlay)}>
        <button
          type="button"
          onClick={onFullscreen}
          className={cn('inline-flex min-h-20 items-center gap-4 rounded-2xl px-10 text-4xl font-bold shadow-pop transition-transform hover:scale-[1.02]', theme.badge)}
        >
          <Maximize size={40} aria-hidden />
          {TV_FULLSCREEN_COPY.button}
        </button>
        <p className="text-lg">{TV_FULLSCREEN_COPY.hint}</p>
        <button type="button" onClick={onDismiss} className="min-h-11 rounded-full px-4 text-base font-medium underline-offset-4 hover:underline">
          {TV_FULLSCREEN_COPY.later}
        </button>
      </div>
    </div>
  )
}
