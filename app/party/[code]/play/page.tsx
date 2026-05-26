'use client'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { StreetView } from '@/components/game/StreetView'
import { GuessMap } from '@/components/game/GuessMap'
import type { PartyPlayerGuess } from '@/components/game/GuessMap'
import type { Location } from '@/lib/gameStore'
import Link from 'next/link'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

interface PartyMember { id: string; name: string; color: string; totalScore: number; locked: boolean; active: boolean }
interface RoundResult { memberId: string; name: string; color: string; guessLat: number; guessLng: number; score: number; distanceKm: number }
interface PartyState {
  phase: 'waiting' | 'playing' | 'round_result' | 'game_over'
  currentRound: number
  totalRounds: number
  timeLimitSecs: number | null
  roundStartedAt: string | null
  actualLat: number | null
  actualLng: number | null
  playingLat: number | null
  playingLng: number | null
  members: PartyMember[]
  roundResult: RoundResult[] | null
  allRoundsHistory: any[] | null
}

export default function PartyPlayPage() {
  return <Suspense><PartyPlayInner /></Suspense>
}

function PartyPlayInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = params.code as string

  const memberId = searchParams.get('mid') ?? ''
  const isHost = searchParams.get('host') === '1'

  const [state, setState] = useState<PartyState | null>(null)
  const [myGuess, setMyGuess] = useState<Location | null>(null)
  const [locked, setLocked] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const lastRoundRef = useRef(0)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/party/${code}/state?memberId=${memberId}`)
      if (!res.ok) return
      const data: PartyState = await res.json()
      setState(prev => {
        // Reset locked/guess state when round changes
        if (prev && data.currentRound !== prev.currentRound) {
          setLocked(false)
          setMyGuess(null)
        }
        return data
      })
    } catch {}
    pollRef.current = setTimeout(poll, 1500)
  }, [code, memberId])

  useEffect(() => {
    poll()
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [poll])

  // Client-side countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!state?.timeLimitSecs || !state.roundStartedAt || state.phase !== 'playing') {
      setTimeLeft(null)
      return
    }
    function tick() {
      const elapsed = (Date.now() - new Date(state!.roundStartedAt!).getTime()) / 1000
      const left = Math.max(0, state!.timeLimitSecs! - elapsed)
      setTimeLeft(Math.ceil(left))
      if (left <= 0 && !locked) {
        // Auto-lock with center-of-world guess if no guess made
        if (!myGuess) lockGuess({ lat: 0, lng: 0 })
      }
    }
    tick()
    timerRef.current = setInterval(tick, 250)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state?.roundStartedAt, state?.phase, state?.timeLimitSecs])

  async function lockGuess(guess: Location) {
    if (locked) return
    setLocked(true)
    await fetch(`/api/party/${code}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, guessLat: guess.lat, guessLng: guess.lng }),
    })
  }

  async function nextRound() {
    await fetch(`/api/party/${code}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
  }

  // ── Waiting lobby ──────────────────────────────────────────────────────────
  if (!state || state.phase === 'waiting') {
    return <WaitingLobby code={code} memberId={memberId} isHost={isHost} members={state?.members ?? []} onStart={async () => {
      await fetch(`/api/party/${code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
    }} />
  }

  // ── Game over ──────────────────────────────────────────────────────────────
  if (state.phase === 'game_over') {
    return <GameOverScreen members={state.members} code={code} />
  }

  // ── Round result ───────────────────────────────────────────────────────────
  if (state.phase === 'round_result' && state.roundResult && state.actualLat != null) {
    const partyGuesses: PartyPlayerGuess[] = state.roundResult.map(r => ({
      name: r.name, color: r.color, lat: r.guessLat, lng: r.guessLng,
    }))
    const me = state.members.find(m => m.id === memberId)

    return (
      <>
        <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
        <div style={{ position: 'relative', zIndex: 10, width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>

          {/* Map takes most of the screen */}
          <div style={{ flex: 1, position: 'relative' }}>
            <GuessMap
              apiKey={API_KEY}
              onGuessChange={() => {}}
              interactive={false}
              actualLocation={{ lat: state.actualLat!, lng: state.actualLng! }}
              partyGuesses={partyGuesses}
            />
          </div>

          {/* Results panel at bottom */}
          <div style={{ background: 'rgba(7,2,26,.97)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--line)', padding: '18px 20px 24px', maxHeight: '55vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.2em', color: 'var(--neon-cyan)', textTransform: 'uppercase' }}>
                Kierros {state.currentRound} / {state.totalRounds} — tulokset
              </div>
              {isHost && (
                <button onClick={nextRound} style={{
                  fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase',
                  padding: '10px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)',
                  color: 'white', boxShadow: '0 0 14px rgba(255,45,149,.4)',
                }}>
                  {state.currentRound >= state.totalRounds ? 'Lopputulos →' : 'Seuraava kierros →'}
                </button>
              )}
              {!isHost && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>Odotetaan hostia…</div>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {state.roundResult.map(r => (
                <div key={r.memberId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,.04)', border: `1px solid ${r.color}44`, borderRadius: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: r.memberId === memberId ? r.color : 'var(--text-mute)', letterSpacing: '.06em' }}>{r.name}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--neon-amber)', letterSpacing: '.06em' }}>Oikea sijainti</span>
              </div>
            </div>

            {/* Scores table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.roundResult.map((r, i) => (
                <div key={r.memberId} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 6,
                  background: r.memberId === memberId ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)',
                  border: `1px solid ${i === 0 ? r.color + '55' : 'var(--line)'}`,
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-dim)', width: 20 }}>#{i + 1}</div>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: r.memberId === memberId ? r.color : 'var(--text-bright)', flex: 1 }}>{r.name}{r.memberId === memberId ? ' (sinä)' : ''}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>{fmtKm(r.distanceKm)}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: i === 0 ? '#fbbf24' : 'var(--text-bright)', textShadow: i === 0 ? '0 0 8px rgba(251,191,36,.4)' : 'none', minWidth: 60, textAlign: 'right' }}>
                    {r.score.toLocaleString('fi')} p
                  </div>
                </div>
              ))}
            </div>

            {/* Running totals */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[...state.members].sort((a, b) => b.totalScore - a.totalScore).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: m.id === memberId ? m.color : 'var(--text-mute)' }}>
                    {m.name}: {m.totalScore.toLocaleString('fi')} p
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  const location = state.playingLat != null ? { lat: state.playingLat, lng: state.playingLng! } : null
  const me = state.members.find(m => m.id === memberId)
  const lockedCount = state.members.filter(m => m.locked).length
  const activeCount = state.members.filter(m => m.active).length

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#07021a' }}>

      {location && API_KEY && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <StreetView
            location={location}
            apiKey={API_KEY}
            onNotFound={() => {}} // party locations are DB-stored, no retry needed
          />
        </div>
      )}

      {/* HUD top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', padding: '7px 14px', borderRadius: 6, textDecoration: 'none', background: 'rgba(7,2,26,.82)', border: '1px solid var(--line)', color: 'var(--text-mute)', backdropFilter: 'blur(12px)' }}>
            ← Menu
          </Link>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, padding: '7px 14px', borderRadius: 6, background: 'rgba(7,2,26,.82)', border: '1px solid rgba(0,240,255,.35)', color: 'var(--neon-cyan)', backdropFilter: 'blur(12px)', letterSpacing: '.1em' }}>
            {state.currentRound} / {state.totalRounds}
          </div>
        </div>

        {/* Timer */}
        {timeLeft != null && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, padding: '7px 16px', borderRadius: 6, background: 'rgba(7,2,26,.82)', backdropFilter: 'blur(12px)', border: `1px solid ${timeLeft <= 10 ? 'rgba(255,107,53,.5)' : 'var(--line)'}`, color: timeLeft <= 10 ? 'var(--neon-coral)' : 'var(--text-bright)', textShadow: timeLeft <= 10 ? '0 0 10px rgba(255,107,53,.5)' : 'none' }}>
            {timeLeft}s
          </div>
        )}

        {/* My score */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, padding: '7px 14px', borderRadius: 6, background: 'rgba(7,2,26,.82)', border: '1px solid rgba(255,214,10,.35)', color: 'var(--neon-amber)', backdropFilter: 'blur(12px)' }}>
          {me?.totalScore.toLocaleString('fi') ?? 0} p
        </div>
      </div>

      {/* Players locked indicator */}
      <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: 6, pointerEvents: 'none' }}>
        {state.members.filter(m => m.active).map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 20,
            background: 'rgba(7,2,26,.88)', backdropFilter: 'blur(10px)',
            border: `1px solid ${m.locked ? m.color : 'rgba(255,255,255,.1)'}`,
            opacity: m.locked ? 1 : 0.55,
            transition: 'all .3s',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.locked ? m.color : 'rgba(255,255,255,.2)', boxShadow: m.locked ? `0 0 6px ${m.color}` : 'none', transition: 'all .3s' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.06em', color: m.locked ? m.color : 'var(--text-dim)', textTransform: 'uppercase' }}>
              {m.id === memberId ? 'sinä' : m.name}
              {m.locked ? ' ✓' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Guess map */}
      {!locked && (
        <div
          style={{
            position: 'absolute', zIndex: 20,
            bottom: 20, right: 20,
            width: mapExpanded ? 'min(480px, calc(100vw - 32px))' : 200,
            height: mapExpanded ? 320 : 160,
            borderRadius: 12, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,.6)',
            transition: 'all .3s ease',
          }}
          onMouseEnter={() => setMapExpanded(true)}
          onMouseLeave={() => setMapExpanded(false)}
        >
          <GuessMap apiKey={API_KEY} onGuessChange={loc => setMyGuess(loc)} interactive />
          <button
            onClick={() => myGuess && lockGuess(myGuess)}
            disabled={!myGuess}
            style={{
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              padding: '9px 20px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 10,
              fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase',
              border: 'none', cursor: myGuess ? 'pointer' : 'not-allowed', transition: 'all .15s',
              background: myGuess ? 'linear-gradient(180deg, var(--neon-magenta), #c61878)' : 'rgba(21,10,54,.8)',
              color: myGuess ? 'white' : 'var(--text-dim)',
              boxShadow: myGuess ? '0 0 16px rgba(255,45,149,.5)' : 'none',
            }}
          >
            {myGuess ? 'Lukitse arvaus →' : 'Klikkaa kartalta'}
          </button>
        </div>
      )}

      {/* Locked overlay */}
      {locked && (
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 20, padding: '12px 18px', borderRadius: 10, background: 'rgba(7,2,26,.9)', border: `1px solid ${me?.color ?? 'var(--neon-cyan)'}55`, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: me?.color ?? 'var(--neon-cyan)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            ✓ Arvaus lukittu
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>
            {lockedCount} / {activeCount} pelaajaa valmis
          </div>
        </div>
      )}
    </div>
  )
}

// ── Waiting lobby ──────────────────────────────────────────────────────────────

function WaitingLobby({ code, memberId, isHost, members, onStart }: {
  code: string; memberId: string; isHost: boolean; members: PartyMember[]; onStart: () => void
}) {
  const [starting, setStarting] = useState(false)
  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${code}` : `/p/${code}`
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%' }}>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: 8 }}>// lobby</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: 'var(--text-bright)', margin: '0 0 4px', lineHeight: 1 }}>Odotetaan<br />pelaajia<span style={{ color: 'var(--neon-magenta)' }}>.</span></h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--neon-cyan)', textShadow: '0 0 8px rgba(0,240,255,.4)', marginBottom: 28 }}>{code}</div>

          {/* Invite link */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,0,0,.3)', border: '1px dashed rgba(0,240,255,.3)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--neon-cyan)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inviteUrl}
            </div>
            <button onClick={copyLink} style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', padding: '10px 14px', borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(0,240,255,.3)', color: 'var(--neon-cyan)', background: copied ? 'rgba(0,240,255,.12)' : 'transparent', whiteSpace: 'nowrap' }}>
              {copied ? '✓ Kopioitu' : '⧉ Kopioi'}
            </button>
          </div>

          {/* Player list */}
          <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.85), rgba(21,10,54,.85))', border: '1px solid var(--line)', borderRadius: 10, padding: 18, marginBottom: 18 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.2em', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: 14 }}>
              Pelaajat ({members.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.length === 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Ei pelaajia vielä…</div>
              )}
              {members.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: m.id === memberId ? m.color : 'var(--text-bright)' }}>
                    {m.name}{m.id === memberId ? ' (sinä)' : ''}
                  </span>
                  {i === 0 && <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, padding: '3px 7px', borderRadius: 3, background: 'rgba(0,240,255,.1)', border: '1px solid rgba(0,240,255,.25)', color: 'var(--neon-cyan)', letterSpacing: '.1em', textTransform: 'uppercase' }}>HOST</span>}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              disabled={members.length < 1 || starting}
              onClick={async () => { setStarting(true); await onStart() }}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                background: starting ? 'rgba(255,255,255,.06)' : 'linear-gradient(180deg, var(--neon-magenta), #c61878)',
                color: starting ? 'var(--text-dim)' : 'white', border: 'none', borderRadius: 6,
                cursor: members.length >= 1 && !starting ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.08em', textTransform: 'uppercase',
                padding: '18px', boxShadow: starting ? 'none' : '0 0 24px rgba(255,45,149,.5)',
              }}
            >
              {starting ? 'Käynnistetään…' : `▶ Aloita peli (${members.length} pelaajaa)`}
            </button>
          ) : (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)', padding: 18, border: '1px solid var(--line)', borderRadius: 6 }}>
              Odotetaan, että hosti aloittaa pelin…
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Game over ──────────────────────────────────────────────────────────────────

function GameOverScreen({ members, code }: { members: PartyMember[]; code: string }) {
  const sorted = [...members].sort((a, b) => b.totalScore - a.totalScore)
  const winner = sorted[0]

  return (
    <>
      <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 500, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 6 }}>Voittaja</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, margin: 0, color: winner?.color ?? 'var(--neon-amber)', textShadow: '0 0 16px currentColor' }}>
              {winner?.name ?? '?'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {sorted.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: `linear-gradient(90deg, ${m.color}11, transparent)`, border: `1px solid ${m.color}33`, borderRadius: 8 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-dim)', width: 28 }}>#{i + 1}</div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: m.color, flex: 1 }}>{m.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: m.color }}>{m.totalScore.toLocaleString('fi')} p</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href={`/party`} style={{ flex: 1, padding: '14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)', color: 'white', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,45,149,.4)' }}>
              Uusi party
            </Link>
            <Link href="/" style={{ flex: 1, padding: '14px', borderRadius: 6, border: '1px solid var(--line)', fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-mute)', background: 'transparent', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Päävalikko
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

function fmtKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('fi')} km`
}
