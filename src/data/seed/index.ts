// Demo data. Dates are relative to `today` so the demo always looks current.
// Routines mirror real coaching density: 4-5 blocks per day, 2-5 exercises per block.
// Only a first run (nothing stored) or 'Restablecer datos de demostración' loads it: stored data is
// never replaced, since persistence has no seed version to tell an old demo from user edits.

import { DEFAULT_BRANDING } from '@/config/branding'
import { EXERCISE_LIBRARY } from '@/data/exercises'
import { addDays, todayISO } from '@/lib/dates'
import { newId } from '@/lib/ids'
import { SCHEMA_VERSION, type AppData, type Client, type ClientNote, type ISODate, type PlanId } from '@/types'
import { program } from './builders'
import { SEED_ADMIN as carla, SEED_MONITOR as dani } from './team'
import { lauraCurrentDays, lauraPreviousDays } from './lauraRoutines'
import { martaDays } from './martaRoutine'
import { andresDays, carlosDays, javierDays } from './otherRoutines'

interface ClientSeed {
  firstName: string
  lastName: string
  plan: PlanId
  trainingDays: number
  joinedDaysAgo: number
  goal: string
  color: string
  archived?: boolean
}

function makeClient(seed: ClientSeed, today: ISODate): Client {
  return {
    id: newId('cli'),
    firstName: seed.firstName,
    lastName: seed.lastName,
    plan: seed.plan,
    trainingDays: seed.trainingDays,
    startDate: addDays(today, -seed.joinedDaysAgo),
    goal: seed.goal,
    color: seed.color,
    archived: seed.archived ?? false,
    currentProgramId: null,
    createdAt: new Date().toISOString(),
  }
}

function makeNote(clientId: string, authorId: string, text: string, daysAgo: number, pinned = false): ClientNote {
  const at = new Date()
  at.setDate(at.getDate() - daysAgo)
  const timestamp = at.toISOString()
  return { id: newId('note'), clientId, authorId, text, pinned, createdAt: timestamp, updatedAt: timestamp }
}

export function createSeedData(today: ISODate = todayISO()): AppData {
  const laura = makeClient({ firstName: 'Laura', lastName: 'Martín', plan: 'plus', trainingDays: 3, joinedDaysAgo: 210, goal: 'Ganar fuerza y mejorar postura', color: '#d6449a' }, today)
  const javier = makeClient({ firstName: 'Javier', lastName: 'Rodríguez', plan: 'standard', trainingDays: 2, joinedDaysAgo: 95, goal: 'Perder grasa sin perder fuerza', color: '#2563eb' }, today)
  const marta = makeClient({ firstName: 'Marta', lastName: 'Hernández', plan: 'elite', trainingDays: 4, joinedDaysAgo: 400, goal: 'Preparar su primera competición de fitness funcional', color: '#7c3aed' }, today)
  const carlos = makeClient({ firstName: 'Carlos', lastName: 'Pérez', plan: 'plus', trainingDays: 3, joinedDaysAgo: 150, goal: 'Volver a ponerse en forma', color: '#059669' }, today)
  const lucia = makeClient({ firstName: 'Lucía', lastName: 'González', plan: 'standard', trainingDays: 2, joinedDaysAgo: 3, goal: 'Tonificar y ganar resistencia', color: '#d97706' }, today)
  const andres = makeClient({ firstName: 'Andrés', lastName: 'Díaz', plan: 'custom', trainingDays: 1, joinedDaysAgo: 60, goal: 'Moverse mejor y aliviar la espalda', color: '#0891b2' }, today)
  const sergio = makeClient({ firstName: 'Sergio', lastName: 'Navarro', plan: 'plus', trainingDays: 3, joinedDaysAgo: 300, goal: 'Fuerza general', color: '#475569', archived: true }, today)

  const programs = [
    program({ clientId: laura.id, coachId: carla.id, startDate: addDays(today, -36), days: lauraPreviousDays(), name: 'Bloque base' }),
    program({ clientId: laura.id, coachId: carla.id, startDate: addDays(today, -8), days: lauraCurrentDays(), name: 'Fuerza otoño' }),
    program({ clientId: javier.id, coachId: dani.id, startDate: addDays(today, -24), days: javierDays() }),
    program({ clientId: marta.id, coachId: dani.id, startDate: addDays(today, -2), days: martaDays(), name: 'Preparación competición' }),
    program({ clientId: carlos.id, coachId: carla.id, startDate: addDays(today, -38), days: carlosDays() }),
    program({ clientId: andres.id, coachId: dani.id, startDate: addDays(today, -14), days: andresDays() }),
  ]
  const currentByClient = new Map(programs.map((p) => [p.clientId, p.id]))
  const clients = [laura, javier, marta, carlos, lucia, andres, sergio].map((c) => ({
    ...c,
    currentProgramId: currentByClient.get(c.id) ?? null,
  }))

  const notes = [
    makeNote(laura.id, carla.id, 'Molestia hombro derecho, evitar press por encima de la cabeza.', 12, true),
    makeNote(laura.id, dani.id, 'Hoy ha subido bien la sentadilla, sin dolor. Mantener progresión.', 2),
    makeNote(marta.id, dani.id, 'Compite en marzo. Revisar técnica de thruster la semana que viene.', 5),
    makeNote(carlos.id, carla.id, 'Ha estado dos semanas fuera por trabajo. Preguntar antes de renovar rutina.', 9),
    makeNote(lucia.id, carla.id, 'Viene de pilates. Primera semana: priorizar técnica.', 1),
  ]

  return {
    schemaVersion: SCHEMA_VERSION,
    clients,
    programs,
    notes,
    library: EXERCISE_LIBRARY.map((exercise) => ({ ...exercise })),
    branding: { ...DEFAULT_BRANDING },
  }
}
