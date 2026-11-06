import { describe, expect, it } from 'vitest'
import type { ScreenDetectionState } from '@/lib/screenDetails'
import { detectionNote } from './screenDetection'

describe('detectionNote', () => {
  it('tells how to connect the TVs when there are none', () => {
    expect(detectionNote('single', 0).title).toBe('No hay ninguna tele conectada: pulsa Win+K y elige Extender')
    expect(detectionNote('ok', 0).title).toBe('No hay ninguna tele conectada: pulsa Win+K y elige Extender')
  })

  it('counts the TVs found', () => {
    expect(detectionNote('ok', 1).title).toBe('1 tele detectada')
    expect(detectionNote('ok', 2).title).toBe('2 teles detectadas')
  })

  it('offers a button only to ask for the permission', () => {
    const states: ScreenDetectionState[] = ['unsupported', 'needs-permission', 'denied', 'single', 'ok']
    expect(states.filter((state) => detectionNote(state, 2).action)).toEqual(['needs-permission'])
  })

  it('explains how to unblock the permission', () => {
    expect(detectionNote('denied', 0).body).toContain('Administración de ventanas')
  })
})
