import { describe, expect, test } from 'vitest'
import { createSettingsStore, DEFAULT_WORKOUT_SETTINGS } from './settings-store'

function createInMemoryStorage() {
  const storedValuesByKey = new Map<string, string>()
  return {
    getItem: (key: string) => storedValuesByKey.get(key) ?? null,
    setItem: (key: string, value: string) => void storedValuesByKey.set(key, value),
  }
}

describe('settings store', () => {
  test('returns defaults when nothing is stored', () => {
    const settingsStore = createSettingsStore(createInMemoryStorage())
    expect(settingsStore.load()).toEqual(DEFAULT_WORKOUT_SETTINGS)
    expect(settingsStore.load()).toEqual({ rounds: 8, workSeconds: 30, restSeconds: 15 })
  })

  test('saved settings round-trip through load, including from a new store on the same storage', () => {
    const storage = createInMemoryStorage()
    createSettingsStore(storage).save({ rounds: 5, workSeconds: 45, restSeconds: 20 })
    expect(createSettingsStore(storage).load()).toEqual({ rounds: 5, workSeconds: 45, restSeconds: 20 })
  })

  test('corrupt stored data falls back to defaults', () => {
    for (const corruptValue of ['not json', 'null', '[1,2,3]', '{"rounds":"5","workSeconds":45,"restSeconds":20}', '{"rounds":5}']) {
      const storage = createInMemoryStorage()
      storage.setItem('workout-timer-settings', corruptValue)
      expect(createSettingsStore(storage).load()).toEqual(DEFAULT_WORKOUT_SETTINGS)
    }
  })

  test('out-of-range or non-integer stored values fall back to defaults', () => {
    const invalidSettingsList = [
      { rounds: 0, workSeconds: 30, restSeconds: 15 },
      { rounds: 5, workSeconds: -1, restSeconds: 15 },
      { rounds: 5, workSeconds: 30, restSeconds: 1.5 },
      { rounds: 1000, workSeconds: 30, restSeconds: 15 },
      { rounds: 5, workSeconds: 99999, restSeconds: 15 },
    ]
    for (const invalidSettings of invalidSettingsList) {
      const storage = createInMemoryStorage()
      storage.setItem('workout-timer-settings', JSON.stringify(invalidSettings))
      expect(createSettingsStore(storage).load()).toEqual(DEFAULT_WORKOUT_SETTINGS)
    }
  })

  test('saving invalid settings throws', () => {
    const settingsStore = createSettingsStore(createInMemoryStorage())
    expect(() => settingsStore.save({ rounds: 0, workSeconds: 30, restSeconds: 15 })).toThrow()
  })
})
