import type { WorkoutSettings } from './settings-store'

export type TimerPhase = 'get-ready' | 'work' | 'rest' | 'done'

export interface TimerState {
  phase: TimerPhase
  round: number
  secondsRemaining: number
  isFinished: boolean
}

const GET_READY_SECONDS = 3
const MILLISECONDS_PER_SECOND = 1000

interface ScheduledPhase {
  phase: Exclude<TimerPhase, 'done'>
  round: number
  durationSeconds: number
}

function assertPositiveInteger(settingName: string, settingValue: number): void {
  if (!Number.isInteger(settingValue) || settingValue <= 0) {
    throw new RangeError(`${settingName} must be a positive integer, received ${settingValue}`)
  }
}

function buildPhaseSchedule(settings: WorkoutSettings): ScheduledPhase[] {
  const schedule: ScheduledPhase[] = [
    { phase: 'get-ready', round: 1, durationSeconds: GET_READY_SECONDS },
  ]
  for (let round = 1; round <= settings.rounds; round++) {
    schedule.push({ phase: 'work', round, durationSeconds: settings.workSeconds })
    if (round < settings.rounds) {
      schedule.push({ phase: 'rest', round, durationSeconds: settings.restSeconds })
    }
  }
  return schedule
}

function assertValidSettings(settings: WorkoutSettings): void {
  assertPositiveInteger('rounds', settings.rounds)
  assertPositiveInteger('workSeconds', settings.workSeconds)
  assertPositiveInteger('restSeconds', settings.restSeconds)
}

export function getTimerState(settings: WorkoutSettings, elapsedMilliseconds: number): TimerState {
  assertValidSettings(settings)
  if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0) {
    throw new RangeError(`elapsedMilliseconds must be a non-negative number, received ${elapsedMilliseconds}`)
  }

  let phaseStartMilliseconds = 0
  for (const scheduledPhase of buildPhaseSchedule(settings)) {
    const phaseEndMilliseconds =
      phaseStartMilliseconds + scheduledPhase.durationSeconds * MILLISECONDS_PER_SECOND
    if (elapsedMilliseconds < phaseEndMilliseconds) {
      return {
        phase: scheduledPhase.phase,
        round: scheduledPhase.round,
        secondsRemaining: Math.ceil((phaseEndMilliseconds - elapsedMilliseconds) / MILLISECONDS_PER_SECOND),
        isFinished: false,
      }
    }
    phaseStartMilliseconds = phaseEndMilliseconds
  }

  return { phase: 'done', round: settings.rounds, secondsRemaining: 0, isFinished: true }
}

export type BeepKind = 'soft' | 'loud'

const SOFT_BEEP_SECONDS_REMAINING = [3, 2, 1]

// Beeps due in the half-open interval (previous, current]; beeps at or before a phase's own start are clipped.
export function getBeepsDue(
  settings: WorkoutSettings,
  previousElapsedMilliseconds: number,
  currentElapsedMilliseconds: number,
): BeepKind[] {
  assertValidSettings(settings)
  if (currentElapsedMilliseconds < previousElapsedMilliseconds) {
    throw new RangeError(
      `currentElapsedMilliseconds (${currentElapsedMilliseconds}) must not be before previousElapsedMilliseconds (${previousElapsedMilliseconds})`,
    )
  }

  const beepsDue: BeepKind[] = []
  let phaseStartMilliseconds = 0
  for (const scheduledPhase of buildPhaseSchedule(settings)) {
    const phaseEndMilliseconds =
      phaseStartMilliseconds + scheduledPhase.durationSeconds * MILLISECONDS_PER_SECOND
    const phaseBeeps: { atMilliseconds: number; kind: BeepKind }[] = [
      ...SOFT_BEEP_SECONDS_REMAINING.map((secondsRemaining) => ({
        atMilliseconds: phaseEndMilliseconds - secondsRemaining * MILLISECONDS_PER_SECOND,
        kind: 'soft' as const,
      })),
      { atMilliseconds: phaseEndMilliseconds, kind: 'loud' },
    ]
    for (const { atMilliseconds, kind } of phaseBeeps) {
      const isInsidePhase = atMilliseconds > phaseStartMilliseconds
      const isDue = atMilliseconds > previousElapsedMilliseconds && atMilliseconds <= currentElapsedMilliseconds
      if (isInsidePhase && isDue) beepsDue.push(kind)
    }
    phaseStartMilliseconds = phaseEndMilliseconds
  }
  return beepsDue
}

export interface PausableClock {
  start(nowMilliseconds: number): void
  pause(nowMilliseconds: number): void
  resume(nowMilliseconds: number): void
  getElapsedMilliseconds(nowMilliseconds: number): number
}

export function createPausableClock(): PausableClock {
  let accumulatedMilliseconds = 0
  let runningSinceMilliseconds: number | null = null

  return {
    start(nowMilliseconds) {
      accumulatedMilliseconds = 0
      runningSinceMilliseconds = nowMilliseconds
    },
    pause(nowMilliseconds) {
      if (runningSinceMilliseconds === null) return
      accumulatedMilliseconds += nowMilliseconds - runningSinceMilliseconds
      runningSinceMilliseconds = null
    },
    resume(nowMilliseconds) {
      if (runningSinceMilliseconds !== null) return
      runningSinceMilliseconds = nowMilliseconds
    },
    getElapsedMilliseconds(nowMilliseconds) {
      return runningSinceMilliseconds === null
        ? accumulatedMilliseconds
        : accumulatedMilliseconds + nowMilliseconds - runningSinceMilliseconds
    },
  }
}
