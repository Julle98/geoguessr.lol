'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { getDevLocation, findValidLocation } from '@/lib/locations'
import { StreetView } from '@/components/game/StreetView'
import { GuessMap } from '@/components/game/GuessMap'
import { RoundTimer } from '@/components/game/RoundTimer'
import { ScoreReveal } from '@/components/game/ScoreReveal'
import { GameOver } from '@/components/game/GameOver'
import Link from 'next/link'
import type { Location } from '@/lib/gameStore'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const USE_DEV_LOCATIONS = !API_KEY

export default function PlayPage() {
  const {
    phase, settings, currentRound, rounds, totalScore,
    currentLocation, currentGuess,
    startGame, setLocation, setGuess, submitGuess, nextRound, resetGame,
  } = useGameStore()

  const [mapExpanded, setMapExpanded] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const locationIndexRef = useRef(0)

  useEffect(() => {
    if (phase !== 'loading') return
    async function load() {
      let loc: Location
      if (USE_DEV_LOCATIONS) {
        loc = getDevLocation(locationIndexRef.current++)
      } else {
        loc = await findValidLocation(settings.region, API_KEY)
      }
      setLocation(loc)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleGuessChange = useCallback((loc: Location) => {
    setGuess(loc)
  }, [setGuess])

  const handleSubmitGuess = useCallback(() => {
    if (!currentGuess) return
    setTimerPaused(true)
    submitGuess()
  }, [currentGuess, submitGuess])

  const handleTimerExpire = useCallback(() => {
    if (!currentGuess) setGuess({ lat: 0, lng: 0 })
    submitGuess()
  }, [currentGuess, setGuess, submitGuess])

  const handleNextRound = useCallback(() => {
    setTimerPaused(false)
    nextRound()
  }, [nextRound])

  // ── Menu ─────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <Link href="/" className="flex items-center gap-2 text-white/30 hover:text-white/70 mb-10 transition-colors font-body text-sm">
            ← Takaisin
          </Link>
          <h1 className="font-display text-5xl font-extrabold gradient-text mb-2">Street View</h1>
          <p className="text-white/40 font-body mb-10">Arvaa missä päin maailmaa olet pelkästään katunäkymän perusteella.</p>

          {!API_KEY && (
            <div className="glass border border-accent-gold/30 rounded-xl p-4 mb-6 text-sm text-accent-gold/80 font-body">
              ⚠️ <strong>Kehitystila:</strong> API-avainta ei löydy. Käytetään tunnettuja sijainteja testaamiseen.
            </div>
          )}

          <div className="glass rounded-2xl p-6 mb-6">
            <div className="text-xs font-display tracking-widest uppercase text-white/30 mb-4">Asetukset</div>
            <SettingsForm onStart={startGame} />
          </div>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-pulse-slow">
          <div className="font-display text-2xl text-accent-green mb-2">Ladataan sijaintia...</div>
          <div className="text-white/30 text-sm font-body">Kierros {currentRound} / {settings.totalRounds}</div>
        </div>
      </div>
    )
  }

  // ── Game Over ─────────────────────────────────────────────────────────────
  if (phase === 'game_over') {
    return (
      <GameOver
        totalScore={totalScore}
        rounds={rounds}
        onPlayAgain={() => {
          locationIndexRef.current = 0
          resetGame()
          setTimeout(() => startGame(), 50)
        }}
      />
    )
  }

  // ── Playing / Round Result ────────────────────────────────────────────────
  const lastRound = rounds[rounds.length - 1]
  const isResultPhase = phase === 'round_result'

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-earth-900">

      {/* Street View — koko ruutu */}
      {currentLocation && (
        <div className="absolute inset-0">
          <StreetView location={currentLocation} apiKey={API_KEY} />
        </div>
      )}

      {/* HUD — yläpalkki */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-4 pb-2 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link href="/" className="glass rounded-xl px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors font-body">
            ← Menu
          </Link>
          <div className="glass rounded-xl px-4 py-1.5 font-display text-sm font-bold text-accent-green">
            {currentRound} / {settings.totalRounds}
          </div>
        </div>

        <div className="glass rounded-xl px-5 py-1.5 font-display font-bold text-white">
          {totalScore.toLocaleString('fi')} <span className="text-accent-green text-sm">p</span>
        </div>

        {!isResultPhase && settings.timeLimitSeconds && (
          <div className="glass rounded-xl px-3 py-1.5 pointer-events-none">
            <RoundTimer
              seconds={settings.timeLimitSeconds}
              onExpire={handleTimerExpire}
              paused={timerPaused}
            />
          </div>
        )}
      </div>

      {/* Arvauskartta — oikeassa alakulmassa, hover suurentaa */}
      {!isResultPhase && (
        <div
          className={`absolute z-20 transition-all duration-300 ease-in-out
            ${mapExpanded
              ? 'bottom-0 right-0 w-full h-full md:w-[480px] md:h-[380px] md:bottom-5 md:right-5 md:rounded-2xl'
              : 'bottom-5 right-5 w-[200px] h-[160px] rounded-xl'
            }
            shadow-2xl overflow-hidden border border-white/10`}
          onMouseEnter={() => setMapExpanded(true)}
          onMouseLeave={() => setMapExpanded(false)}
        >
          <GuessMap
            apiKey={API_KEY}
            onGuessChange={handleGuessChange}
            interactive
          />

          {/* Arvaa-nappi kartan sisällä alhaalla */}
          <button
            onClick={handleSubmitGuess}
            disabled={!currentGuess}
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-xl font-display font-bold text-sm z-10 transition-all duration-150 whitespace-nowrap
              ${currentGuess
                ? 'bg-accent-green text-earth-900 hover:bg-accent-lime active:scale-95 shadow-lg shadow-accent-green/30'
                : 'bg-earth-700/80 text-white/30 cursor-not-allowed'
              }`}
          >
            {currentGuess ? 'Arvaa tämä! →' : 'Valitse sijainti kartalta'}
          </button>
        </div>
      )}

      {/* Tulospaneeli kierroksen jälkeen */}
      {isResultPhase && lastRound && currentLocation && (
        <div className="absolute inset-0 z-30 flex flex-col md:flex-row">
          <div className="flex-1 relative">
            <GuessMap
              apiKey={API_KEY}
              onGuessChange={() => {}}
              interactive={false}
              actualLocation={currentLocation}
              guessLocation={lastRound.guess}
            />
          </div>
          <div className="w-full md:w-[340px] bg-earth-900/95 backdrop-blur border-l border-white/5 flex items-center justify-center overflow-y-auto">
            <ScoreReveal
              score={lastRound.score}
              distanceKm={lastRound.distanceKm}
              totalScore={totalScore}
              round={currentRound}
              totalRounds={settings.totalRounds}
              onNext={handleNextRound}
              isLastRound={currentRound >= settings.totalRounds}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Asetukset ──────────────────────────────────────────────────────────────
function SettingsForm({ onStart }: { onStart: (s?: any) => void }) {
  const [rounds, setRounds] = useState(5)
  const [timeLimit, setTimeLimit] = useState<number | null>(120)
  const [region, setRegion] = useState<'world' | 'europe' | 'asia' | 'americas' | 'africa'>('world')

  return (
    <div className="space-y-5">
      <div>
        <label className="text-white/50 text-xs font-body block mb-2">
          Kierrosten määrä: <span className="text-accent-green font-bold">{rounds}</span>
        </label>
        <input
          type="range" min={1} max={10} value={rounds}
          onChange={e => setRounds(+e.target.value)}
          className="w-full accent-accent-green"
        />
      </div>

      <div>
        <label className="text-white/50 text-xs font-body block mb-2">Aikaraja</label>
        <div className="flex gap-2">
          {[null, 60, 120, 180].map(t => (
            <button
              key={String(t)}
              onClick={() => setTimeLimit(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-display font-bold transition-all
                ${timeLimit === t ? 'bg-accent-green text-earth-900' : 'glass text-white/50 hover:text-white'}`}
            >
              {t === null ? '∞' : `${t}s`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-white/50 text-xs font-body block mb-2">Alue</label>
        <div className="grid grid-cols-3 gap-2">
          {(['world', 'europe', 'asia', 'americas', 'africa'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`py-2 rounded-xl text-xs font-display font-bold transition-all
                ${region === r ? 'bg-accent-green text-earth-900' : 'glass text-white/50 hover:text-white'}`}
            >
              {r === 'world' ? '🌍 Maailma' : r === 'europe' ? '🇪🇺 Eurooppa' : r === 'asia' ? '🌏 Aasia' : r === 'americas' ? '🌎 Amerikat' : '🌍 Afrikka'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onStart({ totalRounds: rounds, timeLimitSeconds: timeLimit, region })}
        className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-accent-green text-earth-900
          hover:bg-accent-lime active:scale-95 transition-all duration-150 shadow-lg shadow-accent-green/20 mt-2"
      >
        Aloita peli 🌍
      </button>
    </div>
  )
}