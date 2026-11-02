import { describe, expect, it } from 'vitest'
import type { LibraryExercise, ExerciseCategory } from '@/types'
import { collectEquipment, EMPTY_EXERCISE_FILTERS, exerciseLinkUrl, exerciseSearchUrl, filterExercises, normalizeExerciseLink } from './exerciseLibrary'

function exercise(name: string, category: ExerciseCategory, equipment: string[]): LibraryExercise {
  return { id: name, name, category, equipment, defaultMeasure: 'reps' }
}

const LIBRARY = [
  exercise('Remo con barra', 'Tracción', ['Barra']),
  exercise('Ábdominal rueda', 'Core', ['Rueda']),
  exercise('Sentadilla goblet', 'Piernas', ['Kettlebell', 'Mancuernas']),
  exercise('Zancada', 'Piernas', ['Mancuernas']),
]

const names = (list: LibraryExercise[]) => list.map((e) => e.name)

describe('filterExercises', () => {
  it('lists everything A–Z when just browsing, ignoring accents', () => {
    expect(names(filterExercises(LIBRARY, EMPTY_EXERCISE_FILTERS))).toEqual(['Ábdominal rueda', 'Remo con barra', 'Sentadilla goblet', 'Zancada'])
  })

  it('does not reorder the library it receives', () => {
    filterExercises(LIBRARY, EMPTY_EXERCISE_FILTERS)
    expect(LIBRARY[0].name).toBe('Remo con barra')
  })

  it('combines category and material', () => {
    expect(names(filterExercises(LIBRARY, { ...EMPTY_EXERCISE_FILTERS, category: 'Piernas' }))).toEqual(['Sentadilla goblet', 'Zancada'])
    expect(names(filterExercises(LIBRARY, { ...EMPTY_EXERCISE_FILTERS, equipment: 'Kettlebell' }))).toEqual(['Sentadilla goblet'])
  })

  it('searches only inside the filtered exercises', () => {
    const filters = { ...EMPTY_EXERCISE_FILTERS, query: 'sentadilla' }
    expect(names(filterExercises(LIBRARY, filters))).toEqual(['Sentadilla goblet'])
    expect(filterExercises(LIBRARY, { ...filters, equipment: 'Barra' })).toEqual([])
  })
})

describe('collectEquipment', () => {
  it('returns each material once, sorted', () => {
    expect(collectEquipment(LIBRARY)).toEqual(['Barra', 'Kettlebell', 'Mancuernas', 'Rueda'])
  })
})

describe('exerciseSearchUrl', () => {
  it('searches the name plus the word ejercicio, encoded', () => {
    expect(exerciseSearchUrl('Press banca')).toBe('https://www.google.com/search?q=Press%20banca%20ejercicio')
    expect(exerciseSearchUrl('  Clean & jerk ñ ')).toBe('https://www.google.com/search?q=Clean%20%26%20jerk%20%C3%B1%20ejercicio')
  })

  it('has no link without a name', () => {
    expect(exerciseSearchUrl('')).toBeNull()
    expect(exerciseSearchUrl('   ')).toBeNull()
  })
})

describe('normalizeExerciseLink', () => {
  it('accepts http and https, and adds https when it is left out', () => {
    expect(normalizeExerciseLink(' https://youtu.be/abc ')).toBe('https://youtu.be/abc')
    expect(normalizeExerciseLink('http://gym.es/remo')).toBe('http://gym.es/remo')
    expect(normalizeExerciseLink('youtube.com/watch?v=1')).toBe('https://youtube.com/watch?v=1')
  })

  it('refuses anything else, above all what could run code', () => {
    for (const text of ['', 'javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,x', 'ftp://gym.es/x', 'vbscript:x', 'hola', 'no es un enlace']) {
      expect(normalizeExerciseLink(text), text).toBeNull()
    }
  })
})

describe('exerciseLinkUrl', () => {
  it('opens the link if there is one, else searches', () => {
    expect(exerciseLinkUrl('Remo', 'https://youtu.be/abc')).toBe('https://youtu.be/abc')
    expect(exerciseLinkUrl('Remo', null)).toBe(exerciseSearchUrl('Remo'))
  })

  it('a link tampered with in the data is never used', () => {
    expect(exerciseLinkUrl('Remo', 'javascript:alert(1)')).toBe(exerciseSearchUrl('Remo'))
  })
})
