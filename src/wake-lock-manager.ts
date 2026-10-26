export interface WakeLockManager {
  acquire(): Promise<void>
  release(): Promise<void>
}

// Degrades to a no-op where the Wake Lock API is unsupported or the request is refused.
export function createWakeLockManager(): WakeLockManager {
  let wakeLockSentinel: WakeLockSentinel | null = null
  let isWanted = false

  async function requestWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator) || wakeLockSentinel !== null) return
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen')
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null
      })
    } catch {
      wakeLockSentinel = null
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (isWanted && document.visibilityState === 'visible') void requestWakeLock()
  })

  return {
    async acquire() {
      isWanted = true
      await requestWakeLock()
    },
    async release() {
      isWanted = false
      const sentinelToRelease = wakeLockSentinel
      wakeLockSentinel = null
      await sentinelToRelease?.release()
    },
  }
}
