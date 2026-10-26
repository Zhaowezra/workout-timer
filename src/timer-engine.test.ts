import { describe, expect, test } from 'vitest'
import { createPausableClock, getBeepsDue, getTimerState } from './timer-engine'

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

describe('getBeepsDue', () => {
  test('reports nothing while no beep boundary is crossed', () => {
    expect(getBeepsDue(threeRoundSettings, 0, 500)).toEqual([])
  })

  test('reports a soft beep at 3, 2 and 1 seconds remaining and a loud beep at 0', () => {
    // get-ready ends at 3000ms, so its beeps come at 0 (clipped), 1000, 2000 and 3000
    expect(getBeepsDue(threeRoundSettings, 0, 999)).toEqual([])
    expect(getBeepsDue(threeRoundSettings, 999, 1000)).toEqual(['soft'])
    expect(getBeepsDue(threeRoundSettings, 1999, 2000)).toEqual(['soft'])
    expect(getBeepsDue(threeRoundSettings, 2999, 3000)).toEqual(['loud'])
  })

  test('does not report a beep again once the previous elapsed time has reached it', () => {
    expect(getBeepsDue(threeRoundSettings, 1000, 1500)).toEqual([])
  })

  test('reports every beep exactly once when a tick jumps across several boundaries', () => {
    expect(getBeepsDue(threeRoundSettings, 0, 3000)).toEqual(['soft', 'soft', 'loud'])
    // work ends at 23000 and rest ends at 33000
    expect(getBeepsDue(threeRoundSettings, 3000, 33000)).toEqual([
      'soft', 'soft', 'soft', 'loud',
      'soft', 'soft', 'soft', 'loud',
    ])
  })

  test('fires the loud beep at workout end', () => {
    const settings = { rounds: 1, workSeconds: 10, restSeconds: 5 }
    expect(getBeepsDue(settings, 12999, 13000)).toEqual(['loud'])
    expect(getBeepsDue(settings, 13000, 20000)).toEqual([])
  })

  test('clips beeps to fit phases of 3 seconds or less', () => {
    const settings = { rounds: 2, workSeconds: 2, restSeconds: 1 }
    // work 3000-5000: soft at 4000, loud at 5000; rest 5000-6000: loud at 6000
    expect(getBeepsDue(settings, 3000, 5000)).toEqual(['soft', 'loud'])
    expect(getBeepsDue(settings, 5000, 6000)).toEqual(['loud'])
  })

  test('rejects an elapsed time that moves backwards', () => {
    expect(() => getBeepsDue(threeRoundSettings, 2000, 1000)).toThrow(RangeError)
  })
})

describe('createPausableClock', () => {
  test('measures elapsed time since start', () => {
    const clock = createPausableClock()
    clock.start(1000)
    expect(clock.getElapsedMilliseconds(4500)).toBe(3500)
  })

  test('freezes elapsed time while paused and continues after resume', () => {
    const clock = createPausableClock()
    clock.start(0)
    clock.pause(2000)
    expect(clock.getElapsedMilliseconds(9000)).toBe(2000)
    clock.resume(10000)
    expect(clock.getElapsedMilliseconds(10500)).toBe(2500)
  })

  test('reports zero before it is started', () => {
    expect(createPausableClock().getElapsedMilliseconds(5000)).toBe(0)
  })
})
