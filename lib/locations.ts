import type { Location } from './gameStore'

const REGIONS = {
  world:    { latRange: [-55, 72] as [number,number], lngRange: [-180, 180] as [number,number] },
  europe:   { latRange: [35, 71]  as [number,number], lngRange: [-10, 40]  as [number,number] },
  asia:     { latRange: [0, 60]   as [number,number], lngRange: [60, 150]  as [number,number] },
  americas: { latRange: [-55, 72] as [number,number], lngRange: [-170, -30] as [number,number] },
  africa:   { latRange: [-35, 37] as [number,number], lngRange: [-18, 52]  as [number,number] },
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export function generateLocation(region: keyof typeof REGIONS = 'world'): Location {
  const r = REGIONS[region]
  return {
    lat: randomInRange(r.latRange[0], r.latRange[1]),
    lng: randomInRange(r.lngRange[0], r.lngRange[1]),
  }
}

export const DEV_LOCATIONS: Location[] = [
  { lat: 48.8584, lng: 2.2945 },
  { lat: 35.6762, lng: 139.6503 },
  { lat: -33.8688, lng: 151.2093 },
  { lat: 40.7484, lng: -73.9967 },
  { lat: 51.5074, lng: -0.1278 },
  { lat: 55.7558, lng: 37.6173 },
  { lat: -23.5505, lng: -46.6333 },
  { lat: 1.3521, lng: 103.8198 },
  { lat: 60.1699, lng: 24.9384 },
  { lat: 41.9028, lng: 12.4964 },
]

export function getDevLocation(index: number): Location {
  return DEV_LOCATIONS[index % DEV_LOCATIONS.length]
}