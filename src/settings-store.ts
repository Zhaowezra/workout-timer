export interface WorkoutSettings {
  rounds: number
  workSeconds: number
  restSeconds: number
}

export interface SettingsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SettingsStore {
  load(): WorkoutSettings
  save(settings: WorkoutSettings): void
}

export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettings = { rounds: 8, workSeconds: 30, restSeconds: 15 }

const STORAGE_KEY = 'workout-timer-settings'
const MAXIMUM_ROUNDS = 99
const MAXIMUM_PHASE_SECONDS = 3600

function isIntegerWithinRange(value: unknown, maximum: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= maximum
}

function isValidWorkoutSettings(candidate: unknown): candidate is WorkoutSettings {
  if (typeof candidate !== 'object' || candidate === null) return false
  const { rounds, workSeconds, restSeconds } = candidate as Record<string, unknown>
  return (
    isIntegerWithinRange(rounds, MAXIMUM_ROUNDS) &&
    isIntegerWithinRange(workSeconds, MAXIMUM_PHASE_SECONDS) &&
    isIntegerWithinRange(restSeconds, MAXIMUM_PHASE_SECONDS)
  )
}

export function createSettingsStore(storage: SettingsStorage): SettingsStore {
  return {
    load() {
      const storedText = storage.getItem(STORAGE_KEY)
      if (storedText === null) return { ...DEFAULT_WORKOUT_SETTINGS }
      try {
        const parsedValue: unknown = JSON.parse(storedText)
        if (isValidWorkoutSettings(parsedValue)) {
          const { rounds, workSeconds, restSeconds } = parsedValue
          return { rounds, workSeconds, restSeconds }
        }
      } catch {
        // corrupt JSON falls through to defaults
      }
      return { ...DEFAULT_WORKOUT_SETTINGS }
    },
    save(settings) {
      if (!isValidWorkoutSettings(settings)) {
        throw new Error(`Invalid workout settings: ${JSON.stringify(settings)}`)
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(settings))
    },
  }
}
