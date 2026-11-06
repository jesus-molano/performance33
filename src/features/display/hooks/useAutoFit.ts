import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import {
  applyFitToElement,
  countHiddenRows,
  fitStyle,
  getFitStages,
  planFit,
  planStage,
  readableMinUnit,
  wrapsTooMuch,
  type DisplayDensity,
  type FitResult,
  type FitStatus,
} from '@/features/display/utils/autoFit'
import { useFitTriggers } from './useFitTriggers'

export interface AutoFitOptions {
  /** May split in two parts when one column does not fit at a good size (a landscape slot only). */
  canSplit: boolean
  /** Manual A-/A+ multiplier of the largest allowed size. */
  fontScale: number
  /** Any value that changes when the content changes (triggers a re-fit). */
  fitKey: unknown
  /** Largest unit to show, so the columns of a TV share one text size. The fit still finds and reports its own. */
  unitCap?: number
  /** Height of the whole TV, for a section of a 2-row grid (see FitPlanInput.referenceHeight). */
  referenceHeight?: number
}

export interface AutoFit extends FitStatus {
  /** What this content could show by itself, before unitCap. */
  fittedUnit: number
  /** Exercise lines left out at the bottom when even the smallest size does not hold the day. */
  hiddenRows: number
  containerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  style: CSSProperties
  density: DisplayDensity
}

interface FitState extends FitResult, FitStatus {
  density: DisplayDensity
  fittedUnit: number
  hiddenRows: number
}

const INITIAL_FIT: FitState = {
  unit: 16,
  fittedUnit: 16,
  columns: 1,
  detail: 0,
  density: 'comfortable',
  overflowing: false,
  tooSmall: false,
  detailHidden: false,
  hiddenRows: 0,
}

const FIT_KEYS = ['unit', 'fittedUnit', 'columns', 'detail', 'density', 'overflowing', 'tooSmall', 'detailHidden', 'hiddenRows'] as const
const sameFit = (a: FitState, b: FitState) => FIT_KEYS.every((key) => a[key] === b[key])

/**
 * Scales a routine view to fill its container without scrolling: binary-searches the largest root
 * font-size (all inner sizes are em) that holds the day, hiding secondary content before going below the target
 * size and growing a short day above it while no name or prescription takes a third line (see planFit), and picks the compact or comfortable density from the container's shape, or tries them in turn
 * on a landscape slot that may split (see getFitStages). With a shared size (unitCap) below its own, the detail level
 * is chosen again at that size, so every section hides the same things at the same size. Re-fits on container resize,
 * content resize (late web fonts, live edits), content change, density change, shared size change and font loading.
 */
export function useAutoFit({ canSplit, fontScale, fitKey, unitCap = Infinity, referenceHeight }: AutoFitOptions): AutoFit {
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
    // The planner asks right after measuring, so this reads the candidate on screen.
    const tooWrapped = () => wrapsTooMuch(container, content)
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
      best = planStage({ width, height, referenceHeight, density, fontScale, canSplit, measure, wrapsTooMuch: tooWrapped }, stage)
      if (!best) stageIndex.current++
    } while (!best)
    const cap = unitCapRef.current
    const input = { width, height, referenceHeight, density, fontScale, canSplit, measure, wrapsTooMuch: tooWrapped, maxUnit: cap }
    const shown = cap < best.unit ? planFit(input) : best
    applyFitToElement(content, shown)
    fittedHeight.current = content.offsetHeight
    const overflowing = fittedHeight.current > height || content.scrollWidth > container.clientWidth
    const next: FitState = {
      ...shown,
      fittedUnit: best.unit,
      density,
      overflowing,
      tooSmall: shown.unit < readableMinUnit(referenceHeight ?? height, density),
      detailHidden: shown.detail > 0,
      hiddenRows: overflowing ? countHiddenRows(container, content) : 0,
    }
    setFit((prev) => (sameFit(prev, next) ? prev : next))
  }, [canSplit, fontScale, referenceHeight])

  const runFit = useCallback(() => {
    stageIndex.current = 0
    continueFit()
  }, [continueFit])

  useLayoutEffect(runFit, [runFit, fitKey, unitCap])
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
    fittedUnit: fit.fittedUnit,
    hiddenRows: fit.hiddenRows,
    style: fitStyle(fit),
    density: fit.density,
    overflowing: fit.overflowing,
    tooSmall: fit.tooSmall,
    detailHidden: fit.detailHidden,
  }
}
