import { describe, expect, it } from 'vitest'
import { detectionFromScreens, toDetectedDisplays } from './detectedDisplays'
import { createScreenDetector, type ScreenDetector } from './screenDetails'
import { fakeBrowser, LAPTOP, tv } from './screenDetails.fakes'

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

async function watch(detector: ScreenDetector): Promise<() => void> {
  const stop = detector.subscribe(() => undefined)
  await settle()
  return stop
}

describe('toDetectedDisplays', () => {
  it('names each screen by its label and keeps its available area and its whole size', () => {
    const [laptop, first] = toDetectedDisplays([LAPTOP, tv(1920, 'LG TV')])
    expect(laptop.key).toBe('Pantalla integrada')
    expect(first).toMatchObject({
      key: 'LG TV',
      label: 'LG TV',
      isPrimary: false,
      area: { left: 1920, top: 0, width: 1920, height: 1032 },
      bounds: { left: 1920, top: 0, width: 1920, height: 1080 },
    })
  })

  it('tells two identical TVs apart by their position', () => {
    const keys = toDetectedDisplays([tv(1920), tv(3840)]).map((d) => d.key)
    expect(keys).toEqual(['Wireless Display@1920,0', 'Wireless Display@3840,0'])
  })

  it('gives an unnamed screen a readable name', () => {
    const [display] = toDetectedDisplays([tv(1920, '  ')])
    expect(display.label).toBe('Pantalla externa 1')
    expect(display.key).toBe('Pantalla externa 1@1920,0')
  })

  it('is ok with two or more screens and single with one', () => {
    expect(detectionFromScreens([LAPTOP, tv(1920)]).state).toBe('ok')
    expect(detectionFromScreens([LAPTOP]).state).toBe('single')
  })
})

describe('createScreenDetector', () => {
  it('is unsupported without the API (Firefox) and never asks', async () => {
    const detector = createScreenDetector(fakeBrowser({ supported: false }).env)
    await watch(detector)
    expect(detector.getSnapshot().state).toBe('unsupported')
    await detector.request()
    expect(detector.getSnapshot().state).toBe('unsupported')
  })

  it('needs the permission before reading the screens, and does not ask by itself', async () => {
    const browser = fakeBrowser({ permission: 'prompt' })
    const detector = createScreenDetector(browser.env)
    await watch(detector)
    expect(detector.getSnapshot().state).toBe('needs-permission')
    expect(browser.calls.getScreenDetails).toBe(0)
  })

  it('reads the TVs once the coach allows it', async () => {
    const browser = fakeBrowser({ permission: 'prompt', screens: [LAPTOP, tv(1920), tv(3840, 'LG TV')] })
    const detector = createScreenDetector(browser.env)
    await watch(detector)
    await detector.request()
    await settle()
    const snapshot = detector.getSnapshot()
    expect(snapshot.state).toBe('ok')
    expect(snapshot.displays.map((d) => d.label)).toEqual(['Pantalla integrada', 'Wireless Display', 'LG TV'])
  })

  it('says it is blocked when the coach answers no', async () => {
    const browser = fakeBrowser({ permission: 'prompt' })
    browser.answer = 'denied'
    const detector = createScreenDetector(browser.env)
    await watch(detector)
    await detector.request()
    await settle()
    expect(detector.getSnapshot().state).toBe('denied')
  })

  it('asks again later when the question is closed without an answer', async () => {
    const browser = fakeBrowser({ permission: 'prompt' })
    browser.answer = 'dismissed'
    const detector = createScreenDetector(browser.env)
    await watch(detector)
    await detector.request()
    expect(detector.getSnapshot().state).toBe('needs-permission')
  })

  it('reads the screens straight away when the permission was given before', async () => {
    const detector = createScreenDetector(fakeBrowser({ permission: 'granted' }).env)
    await watch(detector)
    expect(detector.getSnapshot().state).toBe('ok')
  })

  it('is blocked when the permission was blocked before', async () => {
    const detector = createScreenDetector(fakeBrowser({ permission: 'denied' }).env)
    await watch(detector)
    expect(detector.getSnapshot().state).toBe('denied')
  })

  it('is single when the TVs are not extended, without asking anything', async () => {
    const browser = fakeBrowser({ permission: 'prompt', extended: false })
    const detector = createScreenDetector(browser.env)
    await watch(detector)
    expect(detector.getSnapshot().state).toBe('single')
    expect(browser.calls.getScreenDetails).toBe(0)
  })

  it('follows Win+K: extending, adding and losing a TV', async () => {
    const browser = fakeBrowser({ permission: 'granted', extended: false, screens: [LAPTOP] })
    const detector = createScreenDetector(browser.env)
    let changes = 0
    detector.subscribe(() => changes++)
    await settle()
    expect(detector.getSnapshot().state).toBe('single')

    browser.details.change([LAPTOP, tv(1920)])
    browser.screen.extend(true)
    await settle()
    expect(detector.getSnapshot().state).toBe('ok')

    browser.details.change([LAPTOP, tv(1920), tv(3840, 'LG TV')])
    expect(detector.getSnapshot().displays).toHaveLength(3)

    browser.details.change([LAPTOP])
    expect(detector.getSnapshot().state).toBe('single')
    expect(changes).toBeGreaterThan(2)
  })

  it('notices a permission changed in the browser settings', async () => {
    const browser = fakeBrowser({ permission: 'denied' })
    const detector = createScreenDetector(browser.env)
    await watch(detector)
    browser.permission.change('granted')
    await settle()
    expect(detector.getSnapshot().state).toBe('ok')
  })

  it('stops listening when nobody watches', async () => {
    const browser = fakeBrowser({ permission: 'granted', screens: [LAPTOP, tv(1920)] })
    const detector = createScreenDetector(browser.env)
    const stop = await watch(detector)
    stop()
    browser.details.change([LAPTOP])
    expect(detector.getSnapshot().state).toBe('ok')
  })
})
