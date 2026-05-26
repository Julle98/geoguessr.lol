'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useGameStore } from '@/lib/gameStore'
import { getDevLocation, generateLocation, getFamousSpot, generateOffroadLocation, getDailyLocation } from '@/lib/locations'
import { StreetView } from '@/components/game/StreetView'
import { GuessMap } from '@/components/game/GuessMap'
import { RoundTimer } from '@/components/game/RoundTimer'
import { ScoreReveal } from '@/components/game/ScoreReveal'
import { GameOver } from '@/components/game/GameOver'
import Link from 'next/link'
import { haversine, calculateScore } from '@/lib/gameStore'
import type { Location, GameMode } from '@/lib/gameStore'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const USE_DEV_LOCATIONS = !API_KEY

const MODE_DEFAULTS: Record<GameMode, { totalRounds: number; timeLimitSeconds: number | null; label: string }> = {
  classic: { totalRounds: 5,  timeLimitSeconds: 120,  label: 'Klassikko' },
  blitz:   { totalRounds: 10, timeLimitSeconds: 15,   label: '⚡ Blitz' },
  famous:  { totalRounds: 5,  timeLimitSeconds: 120,  label: '📸 Kuuluisat paikat' },
  offroad: { totalRounds: 5,  timeLimitSeconds: 120,  label: '🌲 Off-Road' },
  duel:    { totalRounds: 5,  timeLimitSeconds: 120,  label: '⚔️ 1v1 Duel' },
  daily:   { totalRounds: 5,  timeLimitSeconds: 120,  label: '📅 Päivän haaste' },
}

function getNextLocation(mode: GameMode, region: string, devIdx: number): Location {
  if (USE_DEV_LOCATIONS) return getDevLocation(devIdx)
  if (mode === 'famous') return getFamousSpot(devIdx)
  if (mode === 'offroad') return generateOffroadLocation()
  if (mode === 'daily') return getDailyLocation(devIdx)
  return generateLocation(region as any)
}

export default function PlayPage() {
  return (
    <Suspense>
      <PlayPageInner />
    </Suspense>
  )
}

function PlayPageInner() {
  const searchParams = useSearchParams()
  const urlMode = (searchParams.get('mode') ?? 'classic') as GameMode

  const {
    phase, settings, currentRound, rounds, totalScore,
    currentLocation, currentGuess,
    duelCurrentPlayer, duelPlayer1Score, duelPlayer2Score,
    duelPlayer1Rounds, duelPlayer2Rounds, duelRoundPhase,
    startGame, setLocation, setGuess, submitGuess, nextRound, resetGame,
  } = useGameStore()

  const [mapExpanded, setMapExpanded] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [duelHidden, setDuelHidden] = useState(false) // screen-cover between duel players
  const locationIndexRef = useRef(0)

  useEffect(() => {
    // Auto-start non-classic modes so they go straight to loading, skipping the settings form
    if (phase === 'menu' && urlMode !== 'classic') {
      const d = MODE_DEFAULTS[urlMode]
      startGame({ mode: urlMode, totalRounds: d.totalRounds, timeLimitSeconds: d.timeLimitSeconds })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMode])

  useEffect(() => {
    return () => { resetGame() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    const loc = getNextLocation(settings.mode, settings.region, locationIndexRef.current++)
    setLocation(loc)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleGuessChange = useCallback((loc: Location) => setGuess(loc), [setGuess])

  const handleSubmitGuess = useCallback(() => {
    if (!currentGuess) return
    setTimerPaused(true)

    if (settings.mode === 'duel') {
      const store = useGameStore.getState()
      const distanceKm = haversine(currentLocation!, currentGuess)
      const score = calculateScore(distanceKm)
      const timeMs = store.roundStartTime ? Date.now() - store.roundStartTime : 0
      const round = { actual: currentLocation!, guess: currentGuess, score, distanceKm, timeMs }

      if (duelRoundPhase === 'player1') {
        useGameStore.setState({
          duelPlayer1Rounds: [...duelPlayer1Rounds, round],
          duelPlayer1Score: duelPlayer1Score + score,
          duelRoundPhase: 'player2',
          currentGuess: null,
          duelCurrentPlayer: 2,
        })
        setDuelHidden(true)
        setTimerPaused(false)
        return
      } else {
        useGameStore.setState({
          duelPlayer2Rounds: [...duelPlayer2Rounds, round],
          duelPlayer2Score: duelPlayer2Score + score,
          duelRoundPhase: 'round_result',
          phase: 'round_result',
          rounds: [...rounds, round],
          totalScore: totalScore + score,
        })
      }
    } else {
      submitGuess()
    }
  }, [currentGuess, currentLocation, duelRoundPhase, duelPlayer1Rounds, duelPlayer2Rounds,
      duelPlayer1Score, duelPlayer2Score, rounds, totalScore, submitGuess, settings.mode])

  const handleTimerExpire = useCallback(() => {
    if (!currentGuess) setGuess({ lat: 0, lng: 0 })
    submitGuess()
  }, [currentGuess, setGuess, submitGuess])

  const handleNextRound = useCallback(() => {
    setTimerPaused(false)
    if (settings.mode === 'duel') {
      useGameStore.setState({ duelRoundPhase: 'player1', duelCurrentPlayer: 1, currentGuess: null })
    }
    nextRound()
  }, [nextRound, settings.mode])

  const handleStreetViewNotFound = useCallback(() => {
    const loc = getNextLocation(settings.mode, settings.region, locationIndexRef.current++)
    setLocation(loc)
  }, [settings.mode, settings.region, setLocation])

  // ── Menu ─────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    const modeDefaults = MODE_DEFAULTS[urlMode] ?? MODE_DEFAULTS.classic
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
              <span style={{ color: 'var(--neon-magenta)', textShadow: 'var(--glow-mag)' }}>{modeDefaults.label}</span>
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-mute)', margin: '0 0 28px' }}>
              {urlMode === 'famous' && 'Arvaa maailman kuuluisimpien nähtävyyksien sijainnit.'}
              {urlMode === 'offroad' && 'Ei kaupunkeja, ei kylttejä — pelkkä luonto ja vaisto.'}
              {urlMode === 'blitz' && 'Ei aikaa miettiä. Pelkkä vaisto ja paniikki.'}
              {urlMode === 'duel' && 'Kaksi pelaajaa, sama laite. Vuorotellen — parempi voittaa.'}
              {urlMode === 'daily' && 'Samat 5 sijaintia kaikille tänään. Vertaa tuloksiasi muihin!'}
              {(urlMode === 'classic' || !urlMode) && 'Arvaa missä päin maailmaa olet pelkästään katunäkymän perusteella.'}
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
              <SettingsForm mode={urlMode} defaults={modeDefaults} onStart={startGame} />
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
    if (settings.mode === 'duel') {
      return (
        <DuelGameOver
          player1Score={duelPlayer1Score}
          player2Score={duelPlayer2Score}
          player1Rounds={duelPlayer1Rounds}
          player2Rounds={duelPlayer2Rounds}
          onPlayAgain={() => {
            locationIndexRef.current = 0
            resetGame()
            setTimeout(() => startGame({ mode: 'duel', totalRounds: settings.totalRounds, timeLimitSeconds: settings.timeLimitSeconds }), 50)
          }}
        />
      )
    }
    return (
      <GameOver
        totalScore={totalScore}
        rounds={rounds}
        region={settings.mode !== 'classic' ? settings.mode : settings.region}
        onPlayAgain={() => {
          const saved = { mode: settings.mode, totalRounds: settings.totalRounds, timeLimitSeconds: settings.timeLimitSeconds, region: settings.region }
          locationIndexRef.current = 0
          resetGame()
          setTimeout(() => startGame(saved), 50)
        }}
      />
    )
  }

  // ── Duel screen cover (between players) ──────────────────────────────────
  if (settings.mode === 'duel' && duelHidden) {
    const prevPlayer = duelCurrentPlayer === 2 ? 1 : 2
    return (
      <>
        <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '.2em', color: 'var(--text-mute)', textTransform: 'uppercase' }}>
            Pelaaja {prevPlayer} arvattu ✓
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: 'var(--neon-magenta)', textShadow: 'var(--glow-mag)' }}>
            Pelaaja {duelCurrentPlayer}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)' }}>
            Kierros {currentRound} / {settings.totalRounds}
          </div>
          <button
            onClick={() => setDuelHidden(false)}
            style={{ marginTop: 16, padding: '14px 32px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase', background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)', color: 'white', boxShadow: '0 0 24px rgba(255,45,149,.5)' }}
          >
            ▶ Pelaaja {duelCurrentPlayer} — Arvaa!
          </button>
        </div>
      </>
    )
  }

  // ── Playing / Round Result ────────────────────────────────────────────────
  const lastRound = rounds[rounds.length - 1]
  const isResultPhase = phase === 'round_result'
  const isDuel = settings.mode === 'duel'

  // Off-road: hide road labels and links
  const offroadStreetViewOptions = settings.mode === 'offroad'
    ? { linksControl: false, showRoadLabels: false }
    : {}

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-earth-900">

      {currentLocation && (
        <div className="absolute inset-0">
          {API_KEY ? (
            <StreetView
              location={currentLocation}
              apiKey={API_KEY}
              onNotFound={handleStreetViewNotFound}
              hideRoadLabels={settings.mode === 'offroad'}
              hideLinks={settings.mode === 'offroad'}
            />
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
          {isDuel && (
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '.08em',
              padding: '7px 14px', borderRadius: 6,
              background: 'rgba(7,2,26,.82)', border: '1px solid rgba(255,45,149,.35)',
              color: 'var(--neon-magenta)', backdropFilter: 'blur(12px)',
            }}>
              Pelaaja {duelRoundPhase === 'player2' ? 2 : 1}
            </div>
          )}
        </div>
        {isDuel ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, padding: '7px 14px', borderRadius: 6, background: 'rgba(7,2,26,.82)', border: '1px solid rgba(0,240,255,.35)', color: 'var(--neon-cyan)', backdropFilter: 'blur(12px)' }}>
              P1: {duelPlayer1Score.toLocaleString('fi')}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, padding: '7px 14px', borderRadius: 6, background: 'rgba(7,2,26,.82)', border: '1px solid rgba(255,45,149,.35)', color: 'var(--neon-magenta)', backdropFilter: 'blur(12px)' }}>
              P2: {duelPlayer2Score.toLocaleString('fi')}
            </div>
          </div>
        ) : (
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: '.05em',
            padding: '7px 18px', borderRadius: 6,
            background: 'rgba(7,2,26,.82)', border: '1px solid rgba(255,214,10,.35)',
            color: 'var(--neon-amber)', backdropFilter: 'blur(12px)',
            textShadow: '0 0 10px rgba(255,214,10,.5)',
          }}>
            {totalScore.toLocaleString('fi')} <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>p</span>
          </div>
        )}
        {!isResultPhase && settings.timeLimitSeconds && (
          <div style={{
            padding: '7px 14px', borderRadius: 6, pointerEvents: 'none',
            background: 'rgba(7,2,26,.82)', border: '1px solid var(--line)',
            backdropFilter: 'blur(12px)',
          }}>
            <RoundTimer
              key={`${currentRound}-${isDuel ? duelRoundPhase : 'solo'}`}
              seconds={settings.timeLimitSeconds}
              onExpire={handleTimerExpire}
              paused={timerPaused}
            />
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
              guessLocation={isDuel
                ? (duelPlayer1Rounds[duelPlayer1Rounds.length - 1]?.guess ?? lastRound.guess)
                : lastRound.guess}
              extraGuessLocation={isDuel
                ? (duelPlayer2Rounds[duelPlayer2Rounds.length - 1]?.guess ?? null)
                : null}
              extraGuessLabel="P2"
            />
          </div>
          <div style={{ width: '100%', maxWidth: 340, background: 'rgba(7,2,26,.96)', backdropFilter: 'blur(16px)', borderLeft: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            {isDuel ? (
              <DuelRoundResult
                round={currentRound}
                totalRounds={settings.totalRounds}
                p1Round={duelPlayer1Rounds[duelPlayer1Rounds.length - 1]}
                p2Round={duelPlayer2Rounds[duelPlayer2Rounds.length - 1]}
                p1Total={duelPlayer1Score}
                p2Total={duelPlayer2Score}
                onNext={handleNextRound}
                isLastRound={currentRound >= settings.totalRounds}
              />
            ) : (
              <ScoreReveal
                score={lastRound.score}
                distanceKm={lastRound.distanceKm}
                totalScore={totalScore}
                round={currentRound}
                totalRounds={settings.totalRounds}
                onNext={handleNextRound}
                isLastRound={currentRound >= settings.totalRounds}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Settings form ─────────────────────────────────────────────────────────────

function SettingsForm({
  mode,
  defaults,
  onStart,
}: {
  mode: GameMode
  defaults: { totalRounds: number; timeLimitSeconds: number | null }
  onStart: (s?: any) => void
}) {
  const [rounds, setRounds] = useState(defaults.totalRounds)
  const [timeLimit, setTimeLimit] = useState<number | null>(defaults.timeLimitSeconds)
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
      {mode !== 'blitz' && (
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
      )}
      {mode === 'classic' && (
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
      )}
      <button
        onClick={() => onStart({
          totalRounds: rounds,
          timeLimitSeconds: mode === 'blitz' ? 15 : timeLimit,
          region,
          mode,
        })}
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

// ── Duel round result ─────────────────────────────────────────────────────────

function DuelRoundResult({ round, totalRounds, p1Round, p2Round, p1Total, p2Total, onNext, isLastRound }: {
  round: number
  totalRounds: number
  p1Round: any
  p2Round: any
  p1Total: number
  p2Total: number
  onNext: () => void
  isLastRound: boolean
}) {
  function fmt(km: number) {
    if (km < 1) return `${Math.round(km * 1000)} m`
    if (km < 100) return `${km.toFixed(1)} km`
    return `${Math.round(km).toLocaleString('fi')} km`
  }

  const p1Wins = (p1Round?.score ?? 0) > (p2Round?.score ?? 0)
  const tie = (p1Round?.score ?? 0) === (p2Round?.score ?? 0)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.2em', color: 'var(--neon-cyan)', textTransform: 'uppercase' }}>
        Kierros {round} / {totalRounds}
      </div>

      {[{ label: 'Pelaaja 1', round: p1Round, total: p1Total, color: 'var(--neon-cyan)' },
        { label: 'Pelaaja 2', round: p2Round, total: p2Total, color: 'var(--neon-magenta)' }
      ].map(({ label, round: r, total, color }) => (
        <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${color}33`, borderRadius: 6, padding: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color, marginBottom: 4 }}>
            {(r?.score ?? 0).toLocaleString('fi')} <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>p</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
            {fmt(r?.distanceKm ?? 0)} · yht. {total.toLocaleString('fi')} p
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 14, color: tie ? 'var(--neon-amber)' : p1Wins ? 'var(--neon-cyan)' : 'var(--neon-magenta)', textShadow: '0 0 10px currentColor' }}>
        {tie ? '🤝 Tasapeli!' : `${p1Wins ? 'Pelaaja 1' : 'Pelaaja 2'} voitti kierroksen!`}
      </div>

      <button onClick={onNext} style={{ padding: '12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)', color: 'white', boxShadow: '0 0 18px rgba(255,45,149,.4)' }}>
        {isLastRound ? 'Lopputulos →' : 'Seuraava kierros →'}
      </button>
    </div>
  )
}

// ── Duel game over ────────────────────────────────────────────────────────────

function DuelGameOver({ player1Score, player2Score, player1Rounds, player2Rounds, onPlayAgain }: {
  player1Score: number
  player2Score: number
  player1Rounds: any[]
  player2Rounds: any[]
  onPlayAgain: () => void
}) {
  const p1Wins = player1Score > player2Score
  const tie = player1Score === player2Score

  function fmt(km: number) {
    if (km < 1) return `${Math.round(km * 1000)} m`
    if (km < 100) return `${km.toFixed(1)} km`
    return `${Math.round(km).toLocaleString('fi')} km`
  }

  return (
    <>
      <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 500, width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{tie ? '🤝' : p1Wins ? '🏆' : '🏆'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Voittaja</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, margin: 0, color: tie ? 'var(--neon-amber)' : p1Wins ? 'var(--neon-cyan)' : 'var(--neon-magenta)', textShadow: '0 0 16px currentColor' }}>
              {tie ? 'Tasapeli!' : p1Wins ? 'Pelaaja 1' : 'Pelaaja 2'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Pelaaja 1', score: player1Score, rounds: player1Rounds, color: 'var(--neon-cyan)' },
              { label: 'Pelaaja 2', score: player2Score, rounds: player2Rounds, color: 'var(--neon-magenta)' },
            ].map(({ label, score, rounds, color }) => (
              <div key={label} style={{ background: `linear-gradient(180deg, ${color}11, transparent)`, border: `1px solid ${color}44`, borderRadius: 8, padding: 18 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 30, color, textShadow: `0 0 12px ${color}55`, marginBottom: 4 }}>{score.toLocaleString('fi')}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>pistettä</div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {rounds.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      <span style={{ color: 'var(--text-dim)' }}>K{i + 1}</span>
                      <span style={{ color: r.score >= 4000 ? '#4ade80' : r.score >= 2000 ? '#fbbf24' : '#f87171' }}>{r.score.toLocaleString('fi')} p</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onPlayAgain} style={{ flex: 1, padding: '14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)', color: 'white', boxShadow: '0 0 24px rgba(255,45,149,.4)' }}>
              Pelaa uudelleen
            </button>
            <Link href="/" style={{ flex: 1, padding: '14px', borderRadius: 6, border: '1px solid var(--line)', fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-mute)', background: 'transparent', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Päävalikko
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
