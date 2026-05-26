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

// Famous landmarks — all have guaranteed Street View coverage
export const FAMOUS_SPOTS: (Location & { name: string })[] = [
  { lat: 48.8584,   lng: 2.2945,    name: 'Eiffel-torni, Pariisi' },
  { lat: 40.6892,   lng: -74.0445,  name: 'Vapaudenpatsas, New York' },
  { lat: 51.5007,   lng: -0.1246,   name: 'Big Ben, Lontoo' },
  { lat: 41.9029,   lng: 12.4534,   name: 'Kolosseum, Rooma' },
  { lat: 27.1751,   lng: 78.0421,   name: 'Taj Mahal, Agra' },
  { lat: 29.9792,   lng: 31.1342,   name: 'Gizaen pyramidit, Kairo' },
  { lat: -22.9519,  lng: -43.2105,  name: 'Kristus-patsas, Rio de Janeiro' },
  { lat: 40.4319,   lng: 116.5704,  name: 'Kiinan muuri, Mutianyu' },
  { lat: 37.8199,   lng: -122.4783, name: 'Golden Gate -silta, San Francisco' },
  { lat: 48.8737,   lng: 2.2950,    name: 'Triumfikaari, Pariisi' },
  { lat: 35.6586,   lng: 139.7454,  name: 'Tokyo Tower, Tokio' },
  { lat: 55.7520,   lng: 37.6175,   name: 'Punainen tori, Moskova' },
  { lat: -33.8568,  lng: 151.2153,  name: 'Oopperatalo, Sydney' },
  { lat: 1.2833,    lng: 103.8607,  name: 'Marina Bay Sands, Singapore' },
  { lat: 43.7230,   lng: 10.3966,   name: 'Pisa-torni, Pisa' },
  { lat: 59.9333,   lng: 30.3667,   name: 'Eremitaasi, Pietari' },
  { lat: 13.4125,   lng: 103.8670,  name: 'Angkor Wat, Kambodža' },
  { lat: -13.1631,  lng: -72.5450,  name: 'Machu Picchu, Peru' },
  { lat: 36.1069,   lng: -112.1129, name: 'Grand Canyon, Arizona' },
  { lat: 64.1466,   lng: -21.9426,  name: 'Hallgrímskirkja, Reykjavik' },
]

export function getFamousSpot(index: number): Location {
  return FAMOUS_SPOTS[index % FAMOUS_SPOTS.length]
}

// Off-road locations — nature, no dense urban areas
const OFFROAD_REGIONS = {
  world: { latRange: [-55, 72] as [number,number], lngRange: [-180, 180] as [number,number] },
}

export function generateOffroadLocation(): Location {
  const candidates = [
    // Forests, mountains, remote roads
    { latRange: [60, 70] as [number,number], lngRange: [20, 30] as [number,number] },   // Scandinavia
    { latRange: [45, 60] as [number,number], lngRange: [20, 50] as [number,number] },   // Eastern Europe/Russia
    { latRange: [-45, -30] as [number,number], lngRange: [165, 175] as [number,number] }, // New Zealand
    { latRange: [-40, -25] as [number,number], lngRange: [115, 150] as [number,number] }, // Australia
    { latRange: [40, 55] as [number,number], lngRange: [-120, -70] as [number,number] }, // Canada/US north
    { latRange: [-55, -40] as [number,number], lngRange: [-75, -65] as [number,number] }, // Patagonia
    { latRange: [0, 20] as [number,number], lngRange: [10, 35] as [number,number] },    // Central Africa
  ]
  const r = candidates[Math.floor(Math.random() * candidates.length)]
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

// Seeded RNG for daily challenge — same locations for everyone on the same day
function seededRandom(seed: number) {
  let x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function getDailyLocation(roundIndex: number): Location {
  const today = new Date()
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const seed = dateSeed * 10 + roundIndex
  const lat = seededRandom(seed) * 127 - 55       // -55 to 72
  const lng = seededRandom(seed + 9999) * 360 - 180 // -180 to 180
  return { lat, lng }
}