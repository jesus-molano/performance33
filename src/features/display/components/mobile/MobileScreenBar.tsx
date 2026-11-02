import { ChevronLeft } from 'lucide-react'
import { goBackInApp } from '@/lib/routes'
import type { Branding } from '@/types'
import { DisplayLogo } from '@/features/display/components/routine/DisplayLogo'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'

interface MobileScreenBarProps {
  backHref: string
  backLabel: string
  /** Goes back to the page it came from when it can; `backHref` is for a page opened directly. */
  returnToPrevious?: boolean
  branding: Branding
  theme: DisplayThemeClasses
}

/** Top of a phone screen page: the way back and the gym's logo. */
export function MobileScreenBar({ backHref, backLabel, returnToPrevious = false, branding, theme }: MobileScreenBarProps) {
  return (
    <div className="flex h-14 items-center justify-between gap-3 pr-4 pl-2">
      <a
        href={backHref}
        onClick={(event) => {
          if (returnToPrevious && goBackInApp()) event.preventDefault()
        }}
        className="flex h-11 items-center gap-1 rounded-xl pr-3 pl-1 text-base font-semibold"
      >
        <ChevronLeft size={22} aria-hidden />
        {backLabel}
      </a>
      <DisplayLogo branding={branding} theme={theme} className="h-8" />
    </div>
  )
}
