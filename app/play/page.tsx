'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useGameStore } from '@/lib/gameStore'
import { getDevLocation, generateLocation } from '@/lib/locations'
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
    return () => { resetGame() }
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    async function load() {
      const loc = USE_DEV_LOCATIONS
        ? getDevLocation(locationIndexRef.current++)
        : generateLocation(settings.region)
      setLocation(loc)
    }
    load()
  }, [phase])

  const handleGuessChange = useCallback((loc: Location) => setGuess(loc), [setGuess])

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

  const handleStreetViewNotFound = useCallback(() => {
    const loc = USE_DEV_LOCATIONS
      ? getDevLocation(locationIndexRef.current++)
      : generateLocation(settings.region)
    setLocation(loc)
  }, [settings.region, setLocation])

  // ── Menu ─────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <>
        <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: 480, width: '100%' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em', color: 'var(--text-mute)', textDecoration: 'none', textTransform: 'uppercase', marginBottom: 36 }}>
              ← Takaisin
            </Link>

            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--neon-cyan)', textTransform: 'uppercase', textShadow: '0 0 6px rgba(0,240,255,.45)', marginBottom: 8 }}>
              // pelaa
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: 'var(--text-bright)', margin: '0 0 8px', lineHeight: 1 }}>
              <span style={{ color: 'var(--neon-magenta)', textShadow: 'var(--glow-mag)' }}>Street</span> View
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-mute)', margin: '0 0 28px' }}>
              Arvaa missä päin maailmaa olet pelkästään katunäkymän perusteella.
            </p>

            {!API_KEY && (
              <div style={{ background: 'rgba(255,214,10,.06)', border: '1px solid rgba(255,214,10,.3)', borderRadius: 6, padding: '12px 16px', marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--neon-amber)' }}>
                ⚠️ Kehitystila — käytetään tunnettuja sijainteja testaamiseen.
              </div>
            )}

            <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.9), rgba(21,10,54,.9))', border: '1px solid var(--line)', borderRadius: 10, padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.2em', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: 18 }}>
                // asetukset
              </div>
              <SettingsForm onStart={startGame} />
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <>
        <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--neon-cyan)', letterSpacing: '.15em', textShadow: 'var(--glow-cyan)', marginBottom: 10 }}>
              LADATAAN...
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>
              Kierros {currentRound} / {settings.totalRounds}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Game Over ─────────────────────────────────────────────────────────────
  if (phase === 'game_over') {
    return (
      <GameOver
        totalScore={totalScore}
        rounds={rounds}
        region={settings.region}
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

      {currentLocation && (
        <div className="absolute inset-0">
          {API_KEY ? (
            <StreetView location={currentLocation} apiKey={API_KEY} onNotFound={handleStreetViewNotFound} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #07021a 0%, #1a0a30 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48 }}>🗺️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.15em', color: 'var(--neon-amber)', textTransform: 'uppercase', textShadow: '0 0 8px rgba(255,214,10,.5)' }}>
                Kehitystila
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', textAlign: 'center', maxWidth: 320 }}>
                Street View ei ole käytettävissä ilman Google Maps API -avainta.<br />
                Sijainti: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HUD */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase',
            padding: '7px 14px', borderRadius: 6, textDecoration: 'none',
            background: 'rgba(7,2,26,.82)', border: '1px solid var(--line)',
            color: 'var(--text-mute)', backdropFilter: 'blur(12px)',
          }}>← Menu</Link>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '.1em',
            padding: '7px 14px', borderRadius: 6,
            background: 'rgba(7,2,26,.82)', border: '1px solid rgba(0,240,255,.35)',
            color: 'var(--neon-cyan)', backdropFilter: 'blur(12px)',
            textShadow: '0 0 8px rgba(0,240,255,.5)',
          }}>
            {currentRound} / {settings.totalRounds}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '.05em',
          padding: '7px 18px', borderRadius: 6,
          background: 'rgba(7,2,26,.82)', border: '1px solid rgba(255,214,10,.35)',
          color: 'var(--neon-amber)', backdropFilter: 'blur(12px)',
          textShadow: '0 0 10px rgba(255,214,10,.5)',
        }}>
          {totalScore.toLocaleString('fi')} <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>p</span>
        </div>
        {!isResultPhase && settings.timeLimitSeconds && (
          <div style={{
            padding: '7px 14px', borderRadius: 6, pointerEvents: 'none',
            background: 'rgba(7,2,26,.82)', border: '1px solid var(--line)',
            backdropFilter: 'blur(12px)',
          }}>
            <RoundTimer seconds={settings.timeLimitSeconds} onExpire={handleTimerExpire} paused={timerPaused} />
          </div>
        )}
      </div>

      {/* Arvauskartta */}
      {!isResultPhase && (
        <div
          className={`absolute z-20 transition-all duration-300 ease-in-out
            ${mapExpanded
              ? 'bottom-0 right-0 w-full h-full md:w-[480px] md:h-[380px] md:bottom-5 md:right-5 md:rounded-2xl'
              : 'bottom-5 right-5 w-[200px] h-[160px] rounded-xl'
            } shadow-2xl overflow-hidden border border-white/10`}
          onMouseEnter={() => setMapExpanded(true)}
          onMouseLeave={() => setMapExpanded(false)}
        >
          <GuessMap apiKey={API_KEY} onGuessChange={handleGuessChange} interactive />
          <button
            onClick={handleSubmitGuess}
            disabled={!currentGuess}
            style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              padding: '10px 22px', borderRadius: 6, fontFamily: 'var(--font-display)',
              fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase',
              whiteSpace: 'nowrap', zIndex: 10, cursor: currentGuess ? 'pointer' : 'not-allowed',
              border: 'none', transition: 'all .15s',
              background: currentGuess ? 'linear-gradient(180deg, var(--neon-magenta), #c61878)' : 'rgba(21,10,54,.8)',
              color: currentGuess ? 'white' : 'var(--text-dim)',
              boxShadow: currentGuess ? '0 0 18px rgba(255,45,149,.5)' : 'none',
            }}
          >
            {currentGuess ? 'Arvaa tämä! →' : 'Valitse sijainti kartalta'}
          </button>
        </div>
      )}

      {/* Tulospaneeli */}
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
          <div style={{ width: '100%', maxWidth: 340, background: 'rgba(7,2,26,.96)', backdropFilter: 'blur(16px)', borderLeft: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
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

function SettingsForm({ onStart }: { onStart: (s?: any) => void }) {
  const [rounds, setRounds] = useState(5)
  const [timeLimit, setTimeLimit] = useState<number | null>(120)
  const [region, setRegion] = useState<'world' | 'europe' | 'asia' | 'americas' | 'africa'>('world')

  const chipBase: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
    padding: '8px 0', borderRadius: 4, textTransform: 'uppercase',
    border: '1px solid var(--line)', cursor: 'pointer', transition: 'all .12s',
    background: 'rgba(255,255,255,.03)', color: 'var(--text-mute)', flex: 1,
  }
  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: 'rgba(255,45,149,.12)', border: '1px solid var(--neon-magenta)',
    color: 'var(--neon-magenta)', textShadow: '0 0 8px rgba(255,45,149,.45)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.15em', color: 'var(--text-mute)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Kierrosten määrä: <span style={{ color: 'var(--neon-cyan)' }}>{rounds}</span>
        </label>
        <input type="range" min={1} max={10} value={rounds} onChange={e => setRounds(+e.target.value)}
          style={{ width: '100%', accentColor: 'var(--neon-magenta)' }} />
      </div>
      <div>
        <label style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.15em', color: 'var(--text-mute)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Aikaraja
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[null, 60, 120, 180].map(t => (
            <button key={String(t)} onClick={() => setTimeLimit(t)} style={timeLimit === t ? chipActive : chipBase}>
              {t === null ? '∞' : `${t}s`}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.15em', color: 'var(--text-mute)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Alue
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {(['world', 'europe', 'asia', 'americas', 'africa'] as const).map(r => (
            <button key={r} onClick={() => setRegion(r)} style={region === r ? chipActive : chipBase}>
              {r === 'world' ? '🌍 Maailma' : r === 'europe' ? '🇪🇺 Eurooppa' : r === 'asia' ? '🌏 Aasia' : r === 'americas' ? '🌎 Amerikat' : '🌍 Afrikka'}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => onStart({ totalRounds: rounds, timeLimitSeconds: timeLimit, region })}
        style={{
          width: '100%', padding: '16px', borderRadius: 6, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.08em', textTransform: 'uppercase',
          background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)',
          color: 'white', boxShadow: '0 0 0 2px rgba(255,255,255,.1) inset, 0 4px 0 #7a0c46, 0 0 24px rgba(255,45,149,.5)',
          marginTop: 4,
        }}
      >
        ▶ Aloita peli
      </button>
    </div>
  )
}
