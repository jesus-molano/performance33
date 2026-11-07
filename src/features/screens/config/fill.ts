// Words of "Rellenar con la clase" and "Vaciar pantallas".

import type { FillPlan } from '@/features/screens/utils/fill'

const list = (people: readonly { name: string }[]) => people.map((p) => p.name).join(', ')

type FillOutcome = Pick<FillPlan, 'placed' | 'notFitted' | 'noRoutine' | 'alreadyShown'>

/** The first part of the toast: what happened on the screens. */
function headline(plan: FillOutcome): string {
  if (plan.placed.length) return `${plan.placed.length} en pantalla`
  if (plan.notFitted.length) return 'Pantallas llenas'
  if (plan.alreadyShown.length) return plan.noRoutine.length ? 'Ya estaban en pantalla' : 'Ya estaban todos en pantalla'
  return 'Nadie en pantalla'
}

export const FILL_COPY = {
  /** 'Rellenar con la clase de 18:00'. */
  fillWith: (time: string) => `Rellenar con la clase de ${time}`,
  noClass: 'Rellenar con la siguiente clase',
  noClassHint: 'No quedan clases hoy',
  classesFailed: 'No se pudieron cargar las clases',
  /** The next days are not known yet: sending now would put everyone on Día 1. */
  daysLoading: 'Cargando…',
  daysFailed: 'Sin conexión',
  fromSlot: 'Mandar a pantallas',
  clear: 'Vaciar pantallas',
  clearHint: 'Ya están vacías',
  nobodyBooked: 'No hay nadie apuntado en esa clase.',
  /** '6 en pantalla · No caben: Ana, Luis · Sin rutina: Marta'. */
  done: (plan: FillOutcome): string =>
    [headline(plan), plan.notFitted.length ? `No caben: ${list(plan.notFitted)}` : '', plan.noRoutine.length ? `Sin rutina: ${list(plan.noRoutine)}` : '']
      .filter(Boolean)
      .join(' · '),
  /** Chrome refused the windows: the fix is the file in Ajustes → Pantallas (or allowing pop-ups for this site). */
  windowsBlocked: (count: number) =>
    `Chrome no dejó abrir ${count === 1 ? '1 pantalla' : `${count} pantallas`}: permite las ventanas emergentes (Ajustes → Pantallas)`,
  cleared: 'Pantallas vaciadas',
  alreadyEmpty: 'Las pantallas ya están vacías.',
} as const
