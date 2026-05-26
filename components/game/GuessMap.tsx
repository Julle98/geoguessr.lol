'use client'
import { useEffect, useRef, useState } from 'react'
import type { Location } from '@/lib/gameStore'
import { loadGoogleMaps } from '@/lib/maps'

export interface PartyPlayerGuess {
  name: string
  color: string
  lat: number
  lng: number
}

interface GuessMapProps {
  apiKey: string
  onGuessChange: (loc: Location) => void
  actualLocation?: Location | null
  guessLocation?: Location | null
  extraGuessLocation?: Location | null
  extraGuessLabel?: string
  interactive?: boolean
  partyGuesses?: PartyPlayerGuess[]
}

export function GuessMap({
  apiKey,
  onGuessChange,
  actualLocation,
  guessLocation,
  extraGuessLocation,
  extraGuessLabel,
  interactive = true,
  partyGuesses,
}: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const actualMarkerRef = useRef<any>(null)
  const guessMarkerRef = useRef<any>(null)
  const extraGuessMarkerRef = useRef<any>(null)
  const partyMarkersRef = useRef<any[]>([])
  const partyLinesRef = useRef<any[]>([])
  const lineRef = useRef<any>(null)
  const extraLineRef = useRef<any>(null)
  const [hasGuess, setHasGuess] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    loadGoogleMaps(apiKey).then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const maps = (window as any).google.maps

      mapRef.current = new maps.Map(containerRef.current, {
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
          const loc: Location = { lat: e.latLng.lat(), lng: e.latLng.lng() }

          if (markerRef.current) markerRef.current.setMap(null)
          markerRef.current = new maps.Marker({
            position: loc,
            map: mapRef.current,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4ade80',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          })

          setHasGuess(true)
          onGuessChange(loc)
        })
      }

      setMapReady(true)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !actualLocation || !guessLocation) return
    if (!(window as any).google?.maps) return

    const maps = (window as any).google.maps

    if (actualMarkerRef.current) actualMarkerRef.current.setMap(null)
    if (guessMarkerRef.current) guessMarkerRef.current.setMap(null)
    if (extraGuessMarkerRef.current) extraGuessMarkerRef.current.setMap(null)
    if (lineRef.current) lineRef.current.setMap(null)
    if (extraLineRef.current) extraLineRef.current.setMap(null)

    // P1 guess — cyan
    guessMarkerRef.current = new maps.Marker({
      position: guessLocation,
      map: mapRef.current,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 11,
        fillColor: '#4ade80',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: extraGuessLocation ? 'Pelaaja 1' : 'Arvauksesi',
    })

    actualMarkerRef.current = new maps.Marker({
      position: actualLocation,
      map: mapRef.current,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 13,
        fillColor: '#fbbf24',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: 'Oikea sijainti',
    })

    lineRef.current = new maps.Polyline({
      path: [guessLocation, actualLocation],
      geodesic: true,
      strokeColor: '#4ade80',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      map: mapRef.current,
    })

    const bounds = new maps.LatLngBounds()
    bounds.extend(actualLocation)
    bounds.extend(guessLocation)

    // P2 guess — magenta (duel mode)
    if (extraGuessLocation) {
      extraGuessMarkerRef.current = new maps.Marker({
        position: extraGuessLocation,
        map: mapRef.current,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: '#ff2d95',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: extraGuessLabel ?? 'Pelaaja 2',
      })
      extraLineRef.current = new maps.Polyline({
        path: [extraGuessLocation, actualLocation],
        geodesic: true,
        strokeColor: '#ff2d95',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map: mapRef.current,
      })
      bounds.extend(extraGuessLocation)
    }

    mapRef.current.fitBounds(bounds, 80)
  }, [mapReady, actualLocation, guessLocation, extraGuessLocation, extraGuessLabel])

  // Party mode: render all players' guesses
  useEffect(() => {
    if (!mapReady || !mapRef.current || !actualLocation || !partyGuesses?.length) return
    if (!(window as any).google?.maps) return

    const maps = (window as any).google.maps

    // Clear old party markers/lines
    partyMarkersRef.current.forEach(m => m.setMap(null))
    partyLinesRef.current.forEach(l => l.setMap(null))
    partyMarkersRef.current = []
    partyLinesRef.current = []

    if (actualMarkerRef.current) actualMarkerRef.current.setMap(null)
    actualMarkerRef.current = new maps.Marker({
      position: actualLocation,
      map: mapRef.current,
      icon: { path: maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#fbbf24', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
      title: 'Oikea sijainti',
      zIndex: 100,
    })

    const bounds = new maps.LatLngBounds()
    bounds.extend(actualLocation)

    partyGuesses.forEach(pg => {
      if (pg.lat === 0 && pg.lng === 0) return // no guess made
      const pos = { lat: pg.lat, lng: pg.lng }
      bounds.extend(pos)

      const marker = new maps.Marker({
        position: pos,
        map: mapRef.current,
        icon: { path: maps.SymbolPath.CIRCLE, scale: 11, fillColor: pg.color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
        title: pg.name,
        zIndex: 50,
      })
      const line = new maps.Polyline({
        path: [pos, actualLocation],
        geodesic: true,
        strokeColor: pg.color,
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map: mapRef.current,
      })
      partyMarkersRef.current.push(marker)
      partyLinesRef.current.push(line)
    })

    mapRef.current.fitBounds(bounds, 60)
  }, [mapReady, actualLocation, partyGuesses])

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