'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('fi')} km`
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min sitten`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} t sitten`
  return `${Math.floor(hours / 24)} pv sitten`
}

const BADGE_DATA = [
  { id: 'b1', name: 'Maailmanmatkaaja', icon: '🌍', rarity: 'common' },
  { id: 'b2', name: 'Blitz-Voittaja',   icon: '⚡', rarity: 'epic' },
  { id: 'b3', name: 'Tarkkapyssy',      icon: '🎯', rarity: 'rare' },
  { id: 'b4', name: 'Party Animal',     icon: '🎉', rarity: 'rare' },
]

const RARITY_COLOR: Record<string, string> = {
  legendary: 'var(--neon-amber)',
  epic:      'var(--neon-magenta)',
  rare:      'var(--neon-cyan)',
  common:    'var(--text-mute)',
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <>
        <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', fontSize: 18, letterSpacing: '.2em', animation: 'pulse 2s infinite' }}>
            LADATAAN...
          </div>
        </div>
      </>
    )
  }

  const user = session?.user as any
  const initial = user?.username?.[0]?.toUpperCase() ?? '?'
  const xp = stats?.totalGames ? Math.min(stats.totalGames * 180, 8000) : 0
  const xpToNext = 8000
  const level = Math.max(1, Math.floor(stats?.totalGames / 5) + 1)

  return (
    <>
      <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>

        {/* Nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px',
          background: 'linear-gradient(180deg, rgba(7,2,26,.92), rgba(7,2,26,.65))',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--line)',
        }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-bright)', textDecoration: 'none', textShadow: '0 0 12px rgba(255,45,149,.55)' }}>
            geoguessr<span style={{ color: 'var(--neon-cyan)' }}>.</span><span style={{ color: 'var(--neon-amber)' }}>lol</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/leaderboard" style={navLinkStyle}>Top 100</Link>
            <Link href="/play" style={navLinkStyle}>▶ Pelaa</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ ...navLinkStyle, background: 'none', border: '1px solid rgba(255,45,149,.3)', color: 'var(--neon-coral)', cursor: 'pointer' }}>
              Kirjaudu ulos
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

          {/* Hero card */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(255,45,149,.15), rgba(177,77,255,.08) 50%, rgba(0,240,255,.15))',
            border: '1px solid var(--line)', borderRadius: 12,
            padding: 28, marginBottom: 22, overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent 0 18px, rgba(255,255,255,.02) 18px 19px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', gap: 22, alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--neon-magenta), var(--neon-violet))',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-display)', fontSize: 28, color: 'white',
                boxShadow: '0 0 0 3px #150a36, 0 0 20px rgba(255,45,149,.5)',
              }}>
                {initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: 6 }}>
                  // level {level} · @{user?.username}
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: 'var(--text-bright)', margin: '0 0 4px', lineHeight: 1 }}>
                  {user?.username}<span style={{ color: 'var(--neon-magenta)' }}>.</span>
                </h1>
                {/* XP bar */}
                <div style={{ marginTop: 14, maxWidth: 400 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 4 }}>
                    <span>XP {xp.toLocaleString('fi')} / {xpToNext.toLocaleString('fi')}</span>
                    <span style={{ color: 'var(--neon-cyan)' }}>seuraava: lvl {level + 1}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(7,2,26,.6)', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (xp / xpToNext) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--neon-magenta), var(--neon-cyan))', boxShadow: '0 0 12px rgba(255,45,149,.45)', transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 22 }}>
              <BigStat n={String(stats.totalGames)} l="pelejä" c="cyan" />
              <BigStat n={stats.bestGame.toLocaleString('fi')} l="paras tulos" c="amber" />
              <BigStat n={stats.avgScore.toLocaleString('fi')} l="keskiarvo" c="magenta" />
              <BigStat n={formatDistance(stats.avgDistance)} l="kesk. virhe" c="violet" />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

            {/* Game history */}
            <Panel title="// viimeisimmät pelit" color="cyan">
              {!stats || stats.games.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', padding: '20px 0' }}>
                  Ei pelejä vielä.{' '}
                  <Link href="/play" style={{ color: 'var(--neon-cyan)' }}>Pelaa ensimmäinen!</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {stats.games.map((g: any) => (
                    <div key={g.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,.015)',
                      border: '1px solid var(--line-soft)', borderRadius: 4,
                    }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.1em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 3 }}>
                          {g.region}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                          {g.rounds} kierrosta · {timeAgo(g.createdAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--neon-amber)', textShadow: '0 0 8px rgba(255,214,10,.45)' }}>
                          {g.totalScore.toLocaleString('fi')}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--neon-cyan)' }}>
                          paras {g.bestRound.toLocaleString('fi')} p
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Badges */}
            <Panel title="// badget" color="amber">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
                {BADGE_DATA.map(b => {
                  const tint = RARITY_COLOR[b.rarity]
                  return (
                    <div key={b.id} style={{
                      padding: '14px 8px', background: 'rgba(255,255,255,.02)',
                      border: `1px solid ${tint}55`, borderRadius: 6,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                      <div style={{ fontSize: 28, filter: `drop-shadow(0 0 10px ${tint})` }}>{b.icon}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-bright)', marginTop: 6, textAlign: 'center' }}>{b.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: tint, marginTop: 2, letterSpacing: '.15em' }}>{b.rarity.toUpperCase()}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/leaderboard" style={actionBtnStyle('cyan')}>🏆 Top 100 →</Link>
                <Link href="/play" style={actionBtnStyle('magenta')}>▶ Pelaa lisää</Link>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </>
  )
}

function Panel({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const tint = color === 'cyan' ? 'var(--neon-cyan)' : color === 'magenta' ? 'var(--neon-magenta)' : color === 'amber' ? 'var(--neon-amber)' : 'var(--neon-violet)'
  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.85), rgba(21,10,54,.85))', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: tint, textShadow: `0 0 8px ${tint}66` }}>
        {title}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function BigStat({ n, l, c }: { n: string; l: string; c: string }) {
  const tint = c === 'cyan' ? 'var(--neon-cyan)' : c === 'magenta' ? 'var(--neon-magenta)' : c === 'amber' ? 'var(--neon-amber)' : 'var(--neon-violet)'
  return (
    <div style={{ padding: 16, background: `linear-gradient(180deg, ${tint}11, transparent)`, border: `1px solid ${tint}44`, borderRadius: 6 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 26, color: tint, textShadow: `0 0 12px ${tint}55`, lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.18em', marginTop: 8, textTransform: 'uppercase' }}>{l}</div>
    </div>
  )
}

const navLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
  padding: '8px 14px', borderRadius: 4, color: 'var(--text-mute)',
  textDecoration: 'none', textTransform: 'uppercase', border: 'none', background: 'transparent',
}

function actionBtnStyle(color: string): React.CSSProperties {
  const tint = color === 'cyan' ? 'var(--neon-cyan)' : 'var(--neon-magenta)'
  const bg   = color === 'cyan' ? 'rgba(0,240,255,.08)' : 'rgba(255,45,149,.08)'
  return {
    display: 'block', textAlign: 'center', padding: '10px 14px',
    border: `1px solid ${tint}55`, borderRadius: 4,
    fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.1em',
    color: tint, background: bg, textDecoration: 'none', textTransform: 'uppercase',
  }
}
