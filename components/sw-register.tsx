'use client'

import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        // Listen for updates
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, activate immediately
              installing.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[SW] register failed', e)
      }
    }
    register()
  }, [])

  return null
}
