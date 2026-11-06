// "El día que le toca": the training sessions the TV sections record, and the next day of each routine (see ARCHITECTURE.md).

export { NEXT_DAY_COPY } from './config/sessions'
export { useLatestSessions, useNextDay, useNextDayLookup, useSessionsReadiness, type SessionsReadiness } from './hooks/useNextDay'
export { localSessionRecorder } from './services/instance'
export type { NextDayView } from './utils/nextDay'
