import { createBeeper } from './beeper'
import { createSettingsStore, type WorkoutSettings } from './settings-store'
import { createPausableClock, getBeepsDue, getTimerState, type TimerState } from './timer-engine'
import { createWakeLockManager } from './wake-lock-manager'

const TICK_INTERVAL_MILLISECONDS = 100

function getElement<ElementType extends HTMLElement>(elementId: string): ElementType {
  const element = document.getElementById(elementId)
  if (element === null) throw new Error(`Missing element #${elementId}`)
  return element as ElementType
}

const setupScreen = getElement('setup-screen')
const runningScreen = getElement('running-screen')
const roundsInput = getElement<HTMLInputElement>('rounds-input')
const workSecondsInput = getElement<HTMLInputElement>('work-seconds-input')
const restSecondsInput = getElement<HTMLInputElement>('rest-seconds-input')
const validationMessage = getElement('validation-message')
const startButton = getElement('start-button')
const pauseResumeButton = getElement('pause-resume-button')
const stopButton = getElement('stop-button')
const phaseLabel = getElement('phase-label')
const countdown = getElement('countdown')
const roundLabel = getElement('round-label')

const settingsStore = createSettingsStore(localStorage)
const beeper = createBeeper()
const wakeLockManager = createWakeLockManager()
const pausableClock = createPausableClock()

let activeSettings: WorkoutSettings | null = null
let tickIntervalId: number | null = null
let previousElapsedMilliseconds = 0
let isPaused = false

function fillInputs(settings: WorkoutSettings): void {
  roundsInput.value = String(settings.rounds)
  workSecondsInput.value = String(settings.workSeconds)
  restSecondsInput.value = String(settings.restSeconds)
}

function parsePositiveInteger(inputElement: HTMLInputElement, fieldName: string): number {
  const parsedValue = Number(inputElement.value)
  if (inputElement.value.trim() === '' || !Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${fieldName} must be a whole number of 1 or more.`)
  }
  return parsedValue
}

function readValidatedSettings(): WorkoutSettings {
  const settings = {
    rounds: parsePositiveInteger(roundsInput, 'Rounds'),
    workSeconds: parsePositiveInteger(workSecondsInput, 'Work'),
    restSeconds: parsePositiveInteger(restSecondsInput, 'Rest'),
  }
  try {
    settingsStore.save(settings)
  } catch {
    throw new Error('Values are too large: up to 99 rounds and 3600 seconds per phase.')
  }
  return settings
}

function renderTimerState(timerState: TimerState, settings: WorkoutSettings): void {
  document.body.className = `phase-${timerState.phase}`
  const phaseNames = { 'get-ready': 'GET READY', work: 'WORK', rest: 'REST', done: 'DONE' }
  phaseLabel.textContent = phaseNames[timerState.phase]
  countdown.textContent = timerState.isFinished ? '✓' : String(timerState.secondsRemaining)
  roundLabel.textContent = timerState.phase === 'get-ready' ? '' : `Round ${timerState.round} of ${settings.rounds}`
}

function stopTickLoop(): void {
  if (tickIntervalId !== null) window.clearInterval(tickIntervalId)
  tickIntervalId = null
}

function showSetupScreen(): void {
  stopTickLoop()
  activeSettings = null
  document.body.className = ''
  runningScreen.hidden = true
  setupScreen.hidden = false
  void wakeLockManager.release()
}

function tick(): void {
  if (activeSettings === null) return
  const currentElapsedMilliseconds = pausableClock.getElapsedMilliseconds(performance.now())
  for (const beepKind of getBeepsDue(activeSettings, previousElapsedMilliseconds, currentElapsedMilliseconds)) {
    beeper.play(beepKind)
  }
  previousElapsedMilliseconds = currentElapsedMilliseconds
  const timerState = getTimerState(activeSettings, currentElapsedMilliseconds)
  renderTimerState(timerState, activeSettings)
  if (timerState.isFinished) {
    stopTickLoop()
    pauseResumeButton.hidden = true
    stopButton.textContent = 'Back'
    void wakeLockManager.release()
  }
}

function startWorkout(): void {
  try {
    activeSettings = readValidatedSettings()
  } catch (validationError) {
    validationMessage.textContent = (validationError as Error).message
    return
  }
  validationMessage.textContent = ''
  beeper.unlock()
  void wakeLockManager.acquire()

  isPaused = false
  previousElapsedMilliseconds = 0
  pauseResumeButton.hidden = false
  pauseResumeButton.textContent = 'Pause'
  stopButton.textContent = 'Stop'
  pausableClock.start(performance.now())
  setupScreen.hidden = true
  runningScreen.hidden = false
  tick()
  tickIntervalId = window.setInterval(tick, TICK_INTERVAL_MILLISECONDS)
}

function togglePause(): void {
  isPaused = !isPaused
  if (isPaused) {
    pausableClock.pause(performance.now())
  } else {
    pausableClock.resume(performance.now())
  }
  pauseResumeButton.textContent = isPaused ? 'Resume' : 'Pause'
}

document.querySelectorAll<HTMLButtonElement>('[data-step-target]').forEach((stepButton) => {
  stepButton.addEventListener('click', () => {
    const targetInput = getElement<HTMLInputElement>(stepButton.dataset.stepTarget as string)
    const steppedValue = (Number(targetInput.value) || 0) + Number(stepButton.dataset.stepAmount)
    targetInput.value = String(Math.max(1, steppedValue))
  })
})
startButton.addEventListener('click', startWorkout)
pauseResumeButton.addEventListener('click', togglePause)
stopButton.addEventListener('click', showSetupScreen)

fillInputs(settingsStore.load())

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
}
