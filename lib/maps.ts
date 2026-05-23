/**
 * Singleton loader for the Google Maps JS SDK.
 * Call from any component — script injected only once.
 */
declare global {
  interface Window {
    __gmapsReady?: boolean
    __gmapsQueue?: Array<() => void>
    __gmapsInit?: () => void
  }
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return

    if (window.__gmapsReady) { resolve(); return }

    if (!window.__gmapsQueue) window.__gmapsQueue = []
    window.__gmapsQueue.push(resolve)

    if (document.getElementById('gmaps-script')) return

    window.__gmapsInit = () => {
      window.__gmapsReady = true
      window.__gmapsQueue?.forEach(cb => cb())
      window.__gmapsQueue = []
    }

    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=streetView&callback=__gmapsInit`
    s.async = true
    document.head.appendChild(s)
  })
}