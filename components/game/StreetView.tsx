'use client'
import { useEffect, useRef, useState } from 'react'
import type { Location } from '@/lib/gameStore'
import { loadGoogleMaps } from '@/lib/maps'

interface StreetViewProps {
  location: Location
  apiKey: string
  onReady?: () => void
  onNotFound?: () => void
}

export function StreetView({ location, apiKey, onReady, onNotFound }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'not_found'>('loading')

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    setStatus('loading')

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return

        const maps = (window as any).google.maps

        if (panoramaRef.current) {
          panoramaRef.current.setVisible(false)
          panoramaRef.current = null
          containerRef.current.innerHTML = ''
        }

        const sv = new maps.StreetViewService()
        sv.getPanorama(
          {
            location,
            radius: 50000,
            preference: maps.StreetViewPreference.NEAREST,
          },
          (data: any, svStatus: any) => {
            if (cancelled || !containerRef.current) return

            if (svStatus !== 'OK') {
              setStatus('not_found')
              onNotFound?.()
              return
            }

            panoramaRef.current = new maps.StreetViewPanorama(
              containerRef.current,
              {
                pano: data.location.pano,
                pov: { heading: Math.random() * 360, pitch: 0 },
                zoom: 0,
                addressControl: false,
                showRoadLabels: false,
                fullscreenControl: false,
                motionTracking: false,
                motionTrackingControl: false,
                linksControl: true,
                panControl: true,
                zoomControl: true,
              }
            )
            setStatus('ok')
            onReady?.()
          }
        )
      })
      .catch(err => {
        console.error('Maps load error:', err)
        if (!cancelled) { setStatus('not_found'); onNotFound?.() }
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng])

  return (
    <div className="street-view-container w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" style={{ visibility: status === 'ok' ? 'visible' : 'hidden' }} />
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #07021a 0%, #1a0a30 100%)', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.15em', color: 'var(--neon-cyan)', textTransform: 'uppercase', textShadow: '0 0 8px rgba(0,240,255,.5)' }}>
            LADATAAN...
          </div>
        </div>
      )}
      {status === 'not_found' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #07021a 0%, #1a0a30 100%)', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>🌊</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '.1em', color: 'var(--neon-amber)', textTransform: 'uppercase' }}>
            Ei katunäkymää tässä sijainnissa
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
            Haetaan uutta sijaintia...
          </div>
        </div>
      )}
    </div>
  )
}