import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import {
  applyFitToElement,
  findFittingUnit,
  fitStyle,
  getUnitBounds,
  prefersTwoColumns,
  type FitResult,
} from '../utils/autoFit'

export interface AutoFitOptions {
  /** 2 lets a landscape full screen split blocks into two columns instead of shrinking text. */
  maxColumns: 1 | 2
  /** Manual A-/A+ multiplier applied after fitting. */
  fontScale: number
  /** Any value that changes when the content changes (triggers a re-fit). */
  fitKey: unknown
}

export interface AutoFit {
  containerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  style: CSSProperties
}

const INITIAL_FIT: FitResult = { unit: 16, columns: 1 }

/**
 * Scales a routine view to fill its container without scrolling: binary-searches the root
 * font-size (all inner sizes are em). Re-fits on resize, content change and font load.
 */
export function useAutoFit({ maxColumns, fontScale, fitKey }: AutoFitOptions): AutoFit {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<FitResult>(INITIAL_FIT)

  const runFit = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const { clientWidth: width, clientHeight: height } = container
    if (!width || !height) return

    const bounds = getUnitBounds(width, height)
    const measure = (columns: number) => (unit: number) => {
      applyFitToElement(content, { unit, columns })
      return content.offsetHeight
    }
    let best: FitResult = { unit: findFittingUnit(measure(1), height, bounds), columns: 1 }
    if (maxColumns > 1 && width > height) {
      const twoColumns = findFittingUnit(measure(2), height, bounds)
      if (prefersTwoColumns(best.unit, twoColumns)) best = { unit: twoColumns, columns: 2 }
    }
    const next: FitResult = { unit: best.unit * fontScale, columns: best.columns }
    applyFitToElement(content, next)
    setFit((prev) => (prev.unit === next.unit && prev.columns === next.columns ? prev : next))
  }, [maxColumns, fontScale])

  useLayoutEffect(runFit, [runFit, fitKey])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let active = true
    const observer = new ResizeObserver(() => runFit())
    observer.observe(container)
    document.fonts?.ready.then(() => {
      if (active) runFit()
    })
    return () => {
      active = false
      observer.disconnect()
    }
  }, [runFit])

  return { containerRef, contentRef, style: fitStyle(fit) }
}
