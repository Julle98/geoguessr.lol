import { create } from 'zustand'

export interface Location {
  lat: number
  lng: number
}

export interface Round {
  actual: Location
  guess: Location | null
  score: number
  distanceKm: number
  timeMs: number
}

export type GamePhase = 'menu' | 'loading' | 'playing' | 'guessing' | 'round_result' | 'game_over'

export type GameMode = 'classic' | 'blitz' | 'famous' | 'offroad' | 'duel' | 'daily'

export interface GameSettings {
  totalRounds: number
  timeLimitSeconds: number | null
  region: 'world' | 'europe' | 'asia' | 'americas' | 'africa'
  mode: GameMode
}

export interface GameState {
  phase: GamePhase
  settings: GameSettings
  currentRound: number
  rounds: Round[]
  currentLocation: Location | null
  currentGuess: Location | null
  totalScore: number
  roundStartTime: number | null
  // 1v1 duel state
  duelCurrentPlayer: 1 | 2
  duelPlayer1Score: number
  duelPlayer2Score: number
  duelPlayer1Rounds: Round[]
  duelPlayer2Rounds: Round[]
  duelRoundPhase: 'player1' | 'player2' | 'round_result'

  // Actions
  startGame: (settings?: Partial<GameSettings>) => void
  setLocation: (loc: Location) => void
  setGuess: (guess: Location) => void
  submitGuess: () => void
  nextRound: () => void
  resetGame: () => void
}

const DEFAULT_SETTINGS: GameSettings = {
  totalRounds: 5,
  timeLimitSeconds: 120,
  region: 'world',
  mode: 'classic',
}

/** Haversine formula — returns distance in km */
export function haversine(a: Location, b: Location): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

/** Score: 5000 * e^(-distance / 2000) */
export function calculateScore(distanceKm: number): number {
  return Math.max(0, Math.round(5000 * Math.exp(-distanceKm / 2000)))
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  settings: DEFAULT_SETTINGS,
  currentRound: 0,
  rounds: [],
  currentLocation: null,
  currentGuess: null,
  totalScore: 0,
  roundStartTime: null,
  duelCurrentPlayer: 1,
  duelPlayer1Score: 0,
  duelPlayer2Score: 0,
  duelPlayer1Rounds: [],
  duelPlayer2Rounds: [],
  duelRoundPhase: 'player1',

  startGame: (overrides = {}) => {
    set({
      phase: 'loading',
      settings: { ...DEFAULT_SETTINGS, ...overrides },
      currentRound: 1,
      rounds: [],
      totalScore: 0,
      currentGuess: null,
      currentLocation: null,
      roundStartTime: null,
      duelCurrentPlayer: 1,
      duelPlayer1Score: 0,
      duelPlayer2Score: 0,
      duelPlayer1Rounds: [],
      duelPlayer2Rounds: [],
      duelRoundPhase: 'player1',
    })
  },

  setLocation: (loc) => {
    set({ currentLocation: loc, phase: 'playing', roundStartTime: Date.now() })
  },

  setGuess: (guess) => {
    set({ currentGuess: guess })
  },

  submitGuess: () => {
    const { currentLocation, currentGuess, rounds, roundStartTime, totalScore, settings } = get()
    if (!currentLocation || !currentGuess) return

    const distanceKm = haversine(currentLocation, currentGuess)
    const score = calculateScore(distanceKm)
    const timeMs = roundStartTime ? Date.now() - roundStartTime : 0

    const round: Round = {
      actual: currentLocation,
      guess: currentGuess,
      score,
      distanceKm,
      timeMs,
    }

    set({
      phase: 'round_result',
      rounds: [...rounds, round],
      totalScore: totalScore + score,
    })
  },

  nextRound: () => {
    const { currentRound, settings } = get()
    if (currentRound >= settings.totalRounds) {
      set({ phase: 'game_over' })
    } else {
      set({
        phase: 'loading',
        currentRound: currentRound + 1,
        currentGuess: null,
        currentLocation: null,
        roundStartTime: null,
      })
    }
  },

  resetGame: () => {
    set({
      phase: 'menu',
      currentRound: 0,
      rounds: [],
      totalScore: 0,
      currentGuess: null,
      currentLocation: null,
      roundStartTime: null,
      duelCurrentPlayer: 1,
      duelPlayer1Score: 0,
      duelPlayer2Score: 0,
      duelPlayer1Rounds: [],
      duelPlayer2Rounds: [],
      duelRoundPhase: 'player1',
    })
  },
}))
