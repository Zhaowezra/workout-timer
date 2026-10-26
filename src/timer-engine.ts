export interface WorkoutSettings {
  rounds: number
  workSeconds: number
  restSeconds: number
}

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

export function getTimerState(settings: WorkoutSettings, elapsedMilliseconds: number): TimerState {
  assertPositiveInteger('rounds', settings.rounds)
  assertPositiveInteger('workSeconds', settings.workSeconds)
  assertPositiveInteger('restSeconds', settings.restSeconds)
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
