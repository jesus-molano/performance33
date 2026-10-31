import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import {
  applyFitToElement,
  findFittingUnit,
  fitStyle,
  getUnitBounds,
  prefersTwoColumns,
  readableMinUnit,
  type FitResult,
  type FitStatus,
} from '@/features/display/utils/autoFit'

export interface AutoFitOptions {
  /** 2 lets a landscape full screen split blocks into two columns instead of shrinking text. */
  maxColumns: 1 | 2
  /** Manual A-/A+ multiplier of the largest allowed size. */
  fontScale: number
  /** Any value that changes when the content changes (triggers a re-fit). */
  fitKey: unknown
}

export interface AutoFit extends FitStatus {
  containerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  style: CSSProperties
}

interface FitState extends FitResult, FitStatus {}

const INITIAL_FIT: FitState = { unit: 16, columns: 1, overflowing: false, tooSmall: false }

const sameFit = (a: FitState, b: FitState) =>
  a.unit === b.unit && a.columns === b.columns && a.overflowing === b.overflowing && a.tooSmall === b.tooSmall

/**
 * Scales a routine view to fill its container without scrolling: binary-searches the root
 * font-size (all inner sizes are em). Re-fits on container resize, content resize (late web
 * fonts, live edits), content change and font loading.
 */
export function useAutoFit({ maxColumns, fontScale, fitKey }: AutoFitOptions): AutoFit {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const fittedHeight = useRef(0)
  const [fit, setFit] = useState<FitState>(INITIAL_FIT)

  const runFit = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const { clientWidth: width, clientHeight: height } = container
    if (!width || !height) return

    const bounds = getUnitBounds(width, height, fontScale)
    const measure = (columns: number) => (unit: number) => {
      applyFitToElement(content, { unit, columns })
      return content.offsetHeight
    }
    let best: FitResult = { unit: findFittingUnit(measure(1), height, bounds), columns: 1 }
    if (maxColumns > 1 && width > height) {
      const twoColumns = findFittingUnit(measure(2), height, bounds)
      if (prefersTwoColumns(best.unit, twoColumns)) best = { unit: twoColumns, columns: 2 }
    }
    applyFitToElement(content, best)
    fittedHeight.current = content.offsetHeight
    const next: FitState = {
      ...best,
      overflowing: fittedHeight.current > height || content.scrollWidth > container.clientWidth,
      tooSmall: best.unit < readableMinUnit(height),
    }
    setFit((prev) => (sameFit(prev, next) ? prev : next))
  }, [maxColumns, fontScale])

  useLayoutEffect(runFit, [runFit, fitKey])

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
    overflowing: fit.overflowing,
    tooSmall: fit.tooSmall,
  }
}
