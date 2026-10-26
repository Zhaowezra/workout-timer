import { describe, expect, test } from 'vitest'
import { getTimerState } from './timer-engine'

const threeRoundSettings = { rounds: 3, workSeconds: 20, restSeconds: 10 }

describe('getTimerState', () => {
  test('starts in get-ready with 3 seconds remaining', () => {
    expect(getTimerState(threeRoundSettings, 0)).toEqual({
      phase: 'get-ready',
      round: 1,
      secondsRemaining: 3,
      isFinished: false,
    })
  })

  test('rounds remaining seconds up while inside a second', () => {
    expect(getTimerState(threeRoundSettings, 2001).secondsRemaining).toBe(1)
  })

  test('switches to work for round 1 exactly at the end of get-ready', () => {
    expect(getTimerState(threeRoundSettings, 3000)).toMatchObject({
      phase: 'work',
      round: 1,
      secondsRemaining: 20,
    })
    expect(getTimerState(threeRoundSettings, 2999).phase).toBe('get-ready')
  })

  test('switches to rest then to work of the next round at boundaries', () => {
    expect(getTimerState(threeRoundSettings, 23000)).toMatchObject({
      phase: 'rest',
      round: 1,
      secondsRemaining: 10,
    })
    expect(getTimerState(threeRoundSettings, 33000)).toMatchObject({
      phase: 'work',
      round: 2,
      secondsRemaining: 20,
    })
  })

  test('has no rest after the final round and finishes after the last work phase', () => {
    // last work starts at 3 + 2*30 = 63s and ends at 83s
    expect(getTimerState(threeRoundSettings, 82999)).toMatchObject({
      phase: 'work',
      round: 3,
      secondsRemaining: 1,
      isFinished: false,
    })
    expect(getTimerState(threeRoundSettings, 83000)).toEqual({
      phase: 'done',
      round: 3,
      secondsRemaining: 0,
      isFinished: true,
    })
    expect(getTimerState(threeRoundSettings, 500000).isFinished).toBe(true)
  })

  test('rejects non-positive or non-integer settings', () => {
    const invalidSettingsList = [
      { rounds: 0, workSeconds: 20, restSeconds: 10 },
      { rounds: 3, workSeconds: -1, restSeconds: 10 },
      { rounds: 3, workSeconds: 20, restSeconds: 0 },
      { rounds: 2.5, workSeconds: 20, restSeconds: 10 },
      { rounds: 3, workSeconds: 20.5, restSeconds: 10 },
      { rounds: 3, workSeconds: 20, restSeconds: Number.NaN },
    ]
    for (const invalidSettings of invalidSettingsList) {
      expect(() => getTimerState(invalidSettings, 0)).toThrow(RangeError)
    }
  })

  test('rejects negative or non-finite elapsed time', () => {
    expect(() => getTimerState(threeRoundSettings, -1)).toThrow(RangeError)
    expect(() => getTimerState(threeRoundSettings, Number.NaN)).toThrow(RangeError)
  })
})
