import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import {
  applyFitToElement,
  fitStyle,
  getDisplayDensity,
  planFit,
  readableMinUnit,
  type DisplayDensity,
  type FitResult,
  type FitStatus,
} from '@/features/display/utils/autoFit'

export interface AutoFitOptions {
  /** Landscape full screen: split blocks into two columns when that makes text clearly bigger. */
  preferColumns: boolean
  /** Manual A-/A+ multiplier of the largest allowed size. */
  fontScale: number
  /** Any value that changes when the content changes (triggers a re-fit). */
  fitKey: unknown
}

export interface AutoFit extends FitStatus {
  containerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  style: CSSProperties
  density: DisplayDensity
}

interface FitState extends FitResult, FitStatus {
  density: DisplayDensity
}

const INITIAL_FIT: FitState = { unit: 16, columns: 1, density: 'comfortable', overflowing: false, tooSmall: false }

const sameFit = (a: FitState, b: FitState) =>
  a.unit === b.unit &&
  a.columns === b.columns &&
  a.density === b.density &&
  a.overflowing === b.overflowing &&
  a.tooSmall === b.tooSmall

/**
 * Scales a routine view to fill its container without scrolling: binary-searches the root
 * font-size (all inner sizes are em) between the readable floor and a max, and picks the compact
 * or comfortable density from the container's shape. Re-fits on container resize, content resize
 * (late web fonts, live edits), content change, density change and font loading.
 */
export function useAutoFit({ preferColumns, fontScale, fitKey }: AutoFitOptions): AutoFit {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const fittedHeight = useRef(0)
  const [fit, setFit] = useState<FitState>(INITIAL_FIT)
  const renderedDensity = useRef<DisplayDensity>(INITIAL_FIT.density)

  const runFit = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const { clientWidth: width, clientHeight: height } = container
    if (!width || !height) return

    const density = getDisplayDensity(width, height)
    if (density !== renderedDensity.current) {
      // Measuring now would use the old density's classes: re-render first, the layout effect measures then.
      renderedDensity.current = density
      setFit((prev) => ({ ...prev, density }))
      return
    }
    const measure = (candidate: FitResult) => {
      applyFitToElement(content, candidate)
      return content.offsetHeight
    }
    const best = planFit({ width, height, density, fontScale, preferColumns, measure })
    applyFitToElement(content, best)
    fittedHeight.current = content.offsetHeight
    const next: FitState = {
      ...best,
      density,
      overflowing: fittedHeight.current > height || content.scrollWidth > container.clientWidth,
      tooSmall: best.unit < readableMinUnit(height, density),
    }
    setFit((prev) => (sameFit(prev, next) ? prev : next))
  }, [preferColumns, fontScale])

  useLayoutEffect(runFit, [runFit, fitKey, fit.density])

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    let active = true
    const containerObserver = new ResizeObserver(() => runFit())
    // Ignore the resizes runFit itself causes; react to the content growing or shrinking on its own.
    const contentObserver = new ResizeObserver(() => {
      if (content.offsetHeight !== fittedHeight.current) runFit()
    })
    containerObserver.observe(container)
    contentObserver.observe(content)
    const fonts = document.fonts
    const onFontsLoaded = () => {
      if (active) runFit()
    }
    fonts?.ready.then(onFontsLoaded)
    fonts?.addEventListener('loadingdone', onFontsLoaded)
    return () => {
      active = false
      containerObserver.disconnect()
      contentObserver.disconnect()
      fonts?.removeEventListener('loadingdone', onFontsLoaded)
    }
  }, [runFit])

  return {
    containerRef,
    contentRef,
    style: fitStyle(fit),
    density: fit.density,
    overflowing: fit.overflowing,
    tooSmall: fit.tooSmall,
  }
}
