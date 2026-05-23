'use client'
import { useEffect, useRef } from 'react'
import type { Location } from '@/lib/gameStore'
import { loadGoogleMaps } from '@/lib/maps'

interface StreetViewProps {
  location: Location
  apiKey: string
  onReady?: () => void
}

export function StreetView({ location, apiKey, onReady }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return

        const g = (window as any).google

        // Tuhoa vanha panoraama kokonaan ennen uuden luomista
        if (panoramaRef.current) {
          panoramaRef.current.setVisible(false)
          panoramaRef.current = null
          containerRef.current.innerHTML = ''
        }

        const sv = new g.maps.StreetViewService()
        sv.getPanorama(
          { location, radius: 50000, preference: g.maps.StreetViewPreference.NEAREST },
          (data: any, status: any) => {
            if (cancelled || !containerRef.current) return
            if (status !== 'OK') {
              console.warn('Street View ei saatavilla tässä sijainnissa')
              return
            }

            panoramaRef.current = new g.maps.StreetViewPanorama(
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
            onReady?.()
          }
        )
      })
      .catch(err => console.error('Maps load error:', err))

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng])

  return (
    <div ref={containerRef} className="street-view-container w-full h-full" />
  )
}