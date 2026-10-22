import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

declare const __APP_BUILD_ID__: string

async function checkForAppUpdate() {
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    })
    if (!res.ok) return
    const data = (await res.json()) as { buildId?: string }
    const remoteBuildId = data?.buildId
    if (!remoteBuildId) return

    if (remoteBuildId !== __APP_BUILD_ID__) {
      const lastAttempted = sessionStorage.getItem('app_memoria_reloaded_build')
      if (lastAttempted === remoteBuildId) return
      sessionStorage.setItem('app_memoria_reloaded_build', remoteBuildId)

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }

      const url = new URL(window.location.href)
      url.searchParams.set('v', remoteBuildId)
      window.location.replace(url.toString())
    } else {
      // Clean up cache-busting query param once running the latest build
      const url = new URL(window.location.href)
      if (url.searchParams.has('v')) {
        url.searchParams.delete('v')
        window.history.replaceState({}, '', url.pathname + url.search + url.hash)
      }
    }
  } catch {
    // Offline or dev server without version.json; continue normally
  }
}

// Check immediately at startup and whenever the app is resumed from background/bfcache
checkForAppUpdate()
window.addEventListener('pageshow', () => {
  checkForAppUpdate()
})
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkForAppUpdate()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
