import type { Location } from './gameStore'
import { FAMOUS_SPOTS } from './locations'

// Hash a string to a stable integer
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
    h = h >>> 0
  }
  return h
}

function seededFloat(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

const REGION_BOUNDS: Record<string, { lat: [number, number]; lng: [number, number] }> = {
  world:    { lat: [-55, 72],  lng: [-180, 180] },
  europe:   { lat: [35, 71],   lng: [-10, 40] },
  asia:     { lat: [0, 60],    lng: [60, 150] },
  americas: { lat: [-55, 72],  lng: [-170, -30] },
  africa:   { lat: [-35, 37],  lng: [-18, 52] },
}

export function getLocationForParty(mode: string, region: string, partyId: string, round: number): Location {
  const base = hashStr(`${partyId}:${round}`)

  if (mode === 'famous') {
    return FAMOUS_SPOTS[base % FAMOUS_SPOTS.length]
  }

  const bounds = REGION_BOUNDS[region] ?? REGION_BOUNDS.world
  const lat = bounds.lat[0] + seededFloat(base) * (bounds.lat[1] - bounds.lat[0])
  const lng = bounds.lng[0] + seededFloat(base + 99991) * (bounds.lng[1] - bounds.lng[0])
  return { lat, lng }
}
