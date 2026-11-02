import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import {
  applyFitToElement,
  fitStyle,
  getFitStages,
  planStage,
  readableMinUnit,
  type DisplayDensity,
  type FitResult,
  type FitStatus,
} from '@/features/display/utils/autoFit'
import { useFitTriggers } from './useFitTriggers'

export interface AutoFitOptions {
  /** One client on a landscape screen: may split in two parts when one column does not fit at a good size. */
  canSplit: boolean
  /** Manual A-/A+ multiplier of the largest allowed size. */
  fontScale: number
  /** Any value that changes when the content changes (triggers a re-fit). */
  fitKey: unknown
  /** Largest unit to show, so the columns of a TV share one text size. The fit still finds and reports its own. */
  unitCap?: number
}

export interface AutoFit extends FitStatus {
  /** What this content could show by itself, before unitCap. */
  fittedUnit: number
  containerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  style: CSSProperties
  density: DisplayDensity
}

interface FitState extends FitResult, FitStatus {
  density: DisplayDensity
}

const INITIAL_FIT: FitState = {
  unit: 16,
  columns: 1,
  detail: 0,
  density: 'comfortable',
  overflowing: false,
  tooSmall: false,
  detailHidden: false,
}

const sameFit = (a: FitState, b: FitState) =>
  a.unit === b.unit &&
  a.columns === b.columns &&
  a.detail === b.detail &&
  a.density === b.density &&
  a.overflowing === b.overflowing &&
  a.tooSmall === b.tooSmall

/**
 * Scales a routine view to fill its container without scrolling: binary-searches the root
 * font-size (all inner sizes are em), hiding secondary content before going below the target
 * size (see planFit), and picks the compact or comfortable density from the container's shape, or tries them in turn
 * for one client on a landscape screen (see getFitStages). Re-fits on container resize, content resize
 * (late web fonts, live edits), content change, density change and font loading.
 */
export function useAutoFit({ canSplit, fontScale, fitKey, unitCap = Infinity }: AutoFitOptions): AutoFit {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const fittedHeight = useRef(0)
  const [fit, setFit] = useState<FitState>(INITIAL_FIT)
  const renderedDensity = useRef<DisplayDensity>(INITIAL_FIT.density)
  const stageIndex = useRef(0)
  /** A density asked for is not on screen yet: the commit that brings it carries on with the walk. */
  const awaitingDensity = useRef(false)
  const unitCapRef = useRef(unitCap)

  useLayoutEffect(() => {
    unitCapRef.current = unitCap
  }, [unitCap])

  const continueFit = useCallback(() => {
    // Measuring now would use the old density's classes. runFit may already have restarted the stages: that commit picks it up.
    if (awaitingDensity.current) return
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const { clientWidth: width, clientHeight: height } = container
    if (!width || !height) return

    const measure = (candidate: FitResult) => {
      applyFitToElement(content, candidate)
      return content.offsetHeight
    }
    const stages = getFitStages(width, height, canSplit)
    let density: DisplayDensity
    let best: FitResult | null = null
    do {
      const stage = stages[Math.min(stageIndex.current, stages.length - 1)]
      density = stage.density
      if (density !== renderedDensity.current) {
        const nextDensity = density
        renderedDensity.current = nextDensity
        awaitingDensity.current = true
        setFit((prev) => ({ ...prev, density: nextDensity }))
        return
      }
      best = planStage({ width, height, density, fontScale, canSplit, measure }, stage)
      if (!best) stageIndex.current++
    } while (!best)
    applyFitToElement(content, { ...best, unit: Math.min(best.unit, unitCapRef.current) })
    fittedHeight.current = content.offsetHeight
    const next: FitState = {
      ...best,
      density,
      overflowing: fittedHeight.current > height || content.scrollWidth > container.clientWidth,
      tooSmall: best.unit < readableMinUnit(height, density),
      detailHidden: best.detail > 0,
    }
    setFit((prev) => (sameFit(prev, next) ? prev : next))
  }, [canSplit, fontScale])

  const runFit = useCallback(() => {
    stageIndex.current = 0
    continueFit()
  }, [continueFit])

  useLayoutEffect(runFit, [runFit, fitKey])
  // Every commit, not only when the density changes: two requests in one batch can leave it where it started, and
  // waiting for a change that never comes would leave the screen on the last size it measured.
  useLayoutEffect(() => {
    if (!awaitingDensity.current || renderedDensity.current !== fit.density) return
    awaitingDensity.current = false
    continueFit()
  })

  useFitTriggers(containerRef, contentRef, fittedHeight, runFit)

  return {
    containerRef,
    contentRef,
    fittedUnit: fit.unit,
    style: fitStyle({ ...fit, unit: Math.min(fit.unit, unitCap) }),
    density: fit.density,
    overflowing: fit.overflowing,
    tooSmall: fit.tooSmall,
    detailHidden: fit.detailHidden,
  }
}
