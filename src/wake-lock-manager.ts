export interface WakeLockManager {
  acquire(): Promise<void>
  release(): Promise<void>
}

// Degrades to a no-op where the Wake Lock API is unsupported or the request is refused.
export function createWakeLockManager(): WakeLockManager {
  let wakeLockSentinel: WakeLockSentinel | null = null
  let isWakeLockWanted = false

  async function requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator) || wakeLockSentinel !== null) return
    try {
      const acquiredSentinel = await navigator.wakeLock.request('screen')
      if (!isWakeLockWanted || wakeLockSentinel !== null) {
        await acquiredSentinel.release()
        return
      }
      wakeLockSentinel = acquiredSentinel
      acquiredSentinel.addEventListener('release', () => {
        if (wakeLockSentinel === acquiredSentinel) wakeLockSentinel = null
      })
    } catch (wakeLockError) {
      console.error('Failed to acquire screen wake lock:', wakeLockError)
      wakeLockSentinel = null
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (isWakeLockWanted && document.visibilityState === 'visible') void requestWakeLock()
  })

  return {
    async acquire() {
      isWakeLockWanted = true
      await requestWakeLock()
    },
    async release() {
      isWakeLockWanted = false
      const sentinelToRelease = wakeLockSentinel
      wakeLockSentinel = null
      await sentinelToRelease?.release()
    },
  }
}
