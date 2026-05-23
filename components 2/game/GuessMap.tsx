'use client'
import { useEffect, useRef, useState } from 'react'
import type { Location } from '@/lib/gameStore'
import { loadGoogleMaps } from '@/lib/maps'

interface GuessMapProps {
  apiKey: string
  onGuessChange: (loc: Location) => void
  actualLocation?: Location | null
  guessLocation?: Location | null
  interactive?: boolean
}

export function GuessMap({
  apiKey,
  onGuessChange,
  actualLocation,
  guessLocation,
  interactive = true,
}: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const actualMarkerRef = useRef<any>(null)
  const guessMarkerRef = useRef<any>(null)
  const lineRef = useRef<any>(null)
  const [hasGuess, setHasGuess] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const g = (window as any).google

      mapRef.current = new g.maps.Map(containerRef.current, {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      })

      if (interactive) {
        mapRef.current.addListener('click', (e: any) => {
          if (!e.latLng) return
          const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() }

          markerRef.current?.setMap(null)
          const g = (window as any).google
          markerRef.current = new g.maps.Marker({
            position: loc,
            map: mapRef.current,
            icon: {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4ade80',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: 'Arvauksesi',
          })

          setHasGuess(true)
          onGuessChange(loc)
        })
      }
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  // Näytä tulos: molemmat markerit + viiva
  useEffect(() => {
    if (!mapRef.current || !actualLocation || !guessLocation) return
    if (typeof (window as any).google === 'undefined') return

    const g = (window as any).google

    actualMarkerRef.current?.setMap(null)
    guessMarkerRef.current?.setMap(null)
    lineRef.current?.setMap(null)

    // Vihreä marker = pelaajan arvaus
    guessMarkerRef.current = new g.maps.Marker({
      position: guessLocation,
      map: mapRef.current,
      icon: {
        path: g.maps.SymbolPath.CIRCLE,
        scale: 11,
        fillColor: '#4ade80',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Arvauksesi',
    })

    // Keltainen marker = oikea sijainti
    actualMarkerRef.current = new g.maps.Marker({
      position: actualLocation,
      map: mapRef.current,
      icon: {
        path: g.maps.SymbolPath.CIRCLE,
        scale: 13,
        fillColor: '#fbbf24',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Oikea sijainti',
    })

    // Viiva arvauksesta oikeaan
    lineRef.current = new g.maps.Polyline({
      path: [guessLocation, actualLocation],
      geodesic: true,
      strokeColor: '#fbbf24',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      map: mapRef.current,
    })

    const bounds = new g.maps.LatLngBounds()
    bounds.extend(actualLocation)
    bounds.extend(guessLocation)
    mapRef.current.fitBounds(bounds, 80)
  }, [actualLocation, guessLocation])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
      {interactive && !hasGuess && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs text-white/50 pointer-events-none whitespace-nowrap">
          Klikkaa kartalta arvataksesi sijainnin
        </div>
      )}
    </div>
  )
}