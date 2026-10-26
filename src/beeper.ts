import type { BeepKind } from './timer-engine'

export interface Beeper {
  unlock(): void
  play(beepKind: BeepKind): void
}

const BEEP_SETTINGS: Record<BeepKind, { frequencyHertz: number; volume: number; durationSeconds: number }> = {
  soft: { frequencyHertz: 660, volume: 0.15, durationSeconds: 0.12 },
  loud: { frequencyHertz: 1320, volume: 0.8, durationSeconds: 0.4 },
}

// Must be created and unlocked inside the Start tap handler for iOS Safari.
export function createBeeper(): Beeper {
  let audioContext: AudioContext | null = null

  return {
    unlock() {
      audioContext ??= new AudioContext()
      void audioContext.resume()
    },
    play(beepKind) {
      if (audioContext === null) throw new Error('Beeper.unlock() must be called from a user gesture before play()')
      const { frequencyHertz, volume, durationSeconds } = BEEP_SETTINGS[beepKind]
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const startTime = audioContext.currentTime
      oscillator.frequency.value = frequencyHertz
      gainNode.gain.setValueAtTime(volume, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + durationSeconds)
      oscillator.connect(gainNode).connect(audioContext.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + durationSeconds)
    },
  }
}
