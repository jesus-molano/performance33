import { useEffect, type RefObject } from 'react'

/** What makes a routine view measure itself again: its container resizing, its content resizing by itself, and web fonts arriving late. */
export function useFitTriggers(
  containerRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  fittedHeight: RefObject<number>,
  runFit: () => void,
): void {
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
  }, [containerRef, contentRef, fittedHeight, runFit])
}
