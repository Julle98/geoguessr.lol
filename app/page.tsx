'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const TAGLINES = [
  'ARVAA TAI ITKE',
  'MAAILMA ON LOL',
  'MISSÄ HELVETISSÄ?',
  'GUESS · CRY · REPEAT',
]

const TICKER = [
  { tag: 'LIVE', txt: '418 peliä käynnissä juuri nyt' },
  { tag: 'NEW',  txt: 'Chaos Party 2.0 — kuusi uutta powerupia' },
  { tag: 'LIVE', txt: 'MAPMASTER_99 löysi reittinsä Bogotaan 12m tarkkuudella' },
  { tag: 'EVT',  txt: 'Viikon haaste: Pohjoismaat — paras keskiarvo voittaa' },
  { tag: 'LIVE', txt: 'miilaaja päihitti vauhti_42:n 1v1 duelissa 4852-3914' },
]

const GAME_MODES = [
  { href: '/play',           icon: '🌍', name: 'Klassikko',    sub: '5 kierrosta · 120s · maailma',  desc: 'Vanha kunnon. Arvaa ja itke kuten ennenkin.', color: 'magenta', live: true },
  { href: '/play?mode=blitz',icon: '⚡', name: 'BLITZ',        sub: '10 kierrosta · 15s/arvaus',     desc: 'Ei aikaa miettiä. Pelkkä vaisto ja paniikki.', color: 'amber',   hot: true },
  { href: '#',               icon: '📸', name: 'Famous Spots', sub: 'vain ikoniset paikat',           desc: 'Eiffel, Times Square, Punainen tori. Easy mode.', color: 'cyan', disabled: true },
  { href: '#',               icon: '🌲', name: 'Off-Road',     sub: 'ei kylttejä · ei autoja',       desc: 'Kasvit, maaperä, taivas. Vaihettelijoille.', color: 'violet', disabled: true },
  { href: '#',               icon: '⚔️', name: '1v1 Duel',     sub: 'tappio = potkut lobbystä',      desc: 'Kaksi entää, yksi jää.', color: 'coral', disabled: true },
  { href: '#',               icon: '🎉', name: 'Chaos Party',  sub: 'powerupit + 8 pelaajaa',        desc: 'Sumua, väärennettyjä karttoja, kaaosta. New!', color: 'magenta', hot: true, disabled: true },
]

const TINT: Record<string, string> = {
  magenta: 'var(--neon-magenta)',
  cyan:    'var(--neon-cyan)',
  amber:   'var(--neon-amber)',
  violet:  'var(--neon-violet)',
  coral:   'var(--neon-coral)',
}

export default function HomePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [tagIdx, setTagIdx] = useState(0)
  const [globalStats, setGlobalStats] = useState<{ totalGames: number; totalUsers: number; topScore: number } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTagIdx(i => (i + 1) % TAGLINES.length), 2600)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/stats/global').then(r => r.json()).then(setGlobalStats)
  }, [])

  const repeated = [...TICKER, ...TICKER]

  return (
    <>
      {/* Arcade background */}
      <div className="app-bg" />
      <div className="app-sun" />
      <div className="app-grid" />
      <div className="app-overlay" />

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>

        {/* Top nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 24,
          padding: '14px 28px',
          background: 'linear-gradient(180deg, rgba(7,2,26,.92), rgba(7,2,26,.65))',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--line)',
        }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            color: 'var(--neon-magenta)', textDecoration: 'none',
            textShadow: '0 0 14px rgba(255,45,149,.6)',
          }}>
            geoguessr<span style={{ color: 'var(--neon-cyan)', textShadow: '0 0 10px rgba(0,240,255,.5)' }}>.</span><span style={{ color: 'var(--neon-amber)', fontSize: 20, textShadow: '0 0 10px rgba(255,214,10,.5)' }}>lol</span>
          </Link>

          <div style={{ flex: 1 }} />

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/leaderboard" style={navLink}>Top 100</Link>
            <Link href="/party" style={navLink}>Party</Link>
            <Link href="/play" style={{ ...navLink, color: 'var(--neon-cyan)', border: '1px solid rgba(0,240,255,.25)', borderRadius: 4 }}>▶ Pelaa</Link>
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />

          {user ? (
            <Link href="/profile" style={{
              fontFamily: 'var(--font-display)', fontSize: 11,
              letterSpacing: '.08em', padding: '8px 14px',
              border: '1px solid var(--neon-magenta)',
              borderRadius: 4, color: 'var(--neon-magenta)',
              textDecoration: 'none', textTransform: 'uppercase',
              textShadow: '0 0 8px rgba(255,45,149,.5)',
            }}>
              {user.username} →
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/login" style={{
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
                padding: '8px 14px', color: 'var(--text-mute)',
                textDecoration: 'none', textTransform: 'uppercase',
              }}>Kirjaudu</Link>
              <Link href="/register" style={{
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
                padding: '8px 14px', borderRadius: 4,
                background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)',
                color: 'white', textDecoration: 'none', textTransform: 'uppercase',
                boxShadow: '0 0 18px rgba(255,45,149,.45)',
              }}>Rekisteröidy</Link>
            </div>
          )}
        </nav>

        {/* Ticker */}
        <div style={{
          overflow: 'hidden', borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          background: 'rgba(0,0,0,.4)', padding: '8px 0',
        }}>
          <div style={{
            display: 'inline-flex', gap: 38, whiteSpace: 'nowrap',
            fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.2em',
            color: 'var(--neon-amber)', textTransform: 'uppercase',
            animation: 'tickerScroll 38s linear infinite',
          }}>
            {repeated.map((it, i) => (
              <span key={i} style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                <b style={{ color: 'var(--neon-magenta)', fontWeight: 'normal' }}>{it.tag}</b>
                <span style={{ color: 'var(--text-mute)' }}>{it.txt}</span>
                <span style={{ color: '#3a1f7a' }}>★</span>
              </span>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '60px 24px 80px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          <div className="animate-fade-up flicker" style={{
            fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em',
            color: 'var(--neon-cyan)', textTransform: 'uppercase',
            textShadow: '0 0 6px rgba(0,240,255,.45)', marginBottom: 18,
          }}>
            ● insert coin · v0.2 early access
          </div>

          <h1 className="animate-fade-up" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(64px, 11vw, 160px)',
            color: 'var(--neon-magenta)',
            letterSpacing: '.02em', lineHeight: .85, margin: 0,
            textShadow: '0 0 18px rgba(255,45,149,.7), 0 0 48px rgba(255,45,149,.4), 0 0 80px rgba(255,45,149,.25)',
          }}>
            geoguessr<span style={{
              color: 'var(--neon-cyan)',
              textShadow: '0 0 18px rgba(0,240,255,.7), 0 0 48px rgba(0,240,255,.4)',
            }}>.lol</span>
          </h1>

          <div key={tagIdx} className="animate-fade-up" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(18px, 3vw, 28px)',
            color: 'var(--neon-amber)',
            textShadow: 'var(--glow-amber)',
            marginTop: 20, height: 40,
          }}>
            {TAGLINES[tagIdx]}
          </div>

          <p style={{
            color: 'var(--text-mute)', maxWidth: 560, fontSize: 17,
            marginTop: 24, marginBottom: 36, fontFamily: 'var(--font-body)',
          }}>
            Ilmaiseksi avoimen lähdekoodin geo-arvauspeli party-moodilla.
            Ei tilausmaksuja. Ei paywallia. Pelkkä maailma, kaverit ja noloja arvauksia.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            <Link href="/play" style={{
              background: 'linear-gradient(180deg, var(--neon-magenta), #c61878)',
              color: 'white', border: 'none',
              fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.08em',
              padding: '18px 32px', borderRadius: 6, cursor: 'pointer',
              boxShadow: '0 0 0 2px rgba(255,255,255,.1) inset, 0 4px 0 #7a0c46, 0 0 24px rgba(255,45,149,.5)',
              textDecoration: 'none', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>▶ Aloita peli</Link>
            <Link href="/party" style={{
              fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.06em',
              padding: '14px 22px', border: '2px solid var(--neon-cyan)',
              borderRadius: 6, color: 'var(--neon-cyan)', background: 'transparent',
              textDecoration: 'none', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>+ Party mode</Link>
            <Link href="/leaderboard" style={{
              fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '.06em',
              padding: '14px 22px', border: '2px solid var(--line)',
              borderRadius: 6, color: 'var(--text-mute)', background: 'transparent',
              textDecoration: 'none', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>Top 100</Link>
          </div>

          {/* Live stats */}
          <div style={{
            display: 'flex', gap: 32,
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)',
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {[
              { n: globalStats ? globalStats.totalGames.toLocaleString('fi') : '—', l: 'peliä pelattu',   c: 'var(--neon-cyan)' },
              { n: globalStats ? globalStats.totalUsers.toLocaleString('fi') : '—', l: 'pelaajaa',        c: 'var(--neon-magenta)' },
              { n: globalStats ? globalStats.topScore.toLocaleString('fi') : '—',   l: 'paras tulos',     c: 'var(--neon-amber)' },
            ].map(({ n, l, c }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: c, textShadow: `0 0 12px ${c}66` }}>{n}</div>
                <div style={{ marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Game modes grid */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em',
                color: 'var(--neon-cyan)', textTransform: 'uppercase',
                textShadow: '0 0 6px rgba(0,240,255,.45)', marginBottom: 6,
              }}>// pelimoodit</div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-bright)', fontSize: 28, margin: 0 }}>
                Valitse vibe
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {GAME_MODES.map(m => (
              <ModeCard key={m.name} mode={m} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid var(--line)', padding: '32px 24px 60px',
          textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--text-dim)', position: 'relative', zIndex: 10,
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            color: 'var(--neon-magenta)', textShadow: 'var(--glow-mag)', marginBottom: 16,
          }}>
            geoguessr<span style={{ color: 'var(--neon-cyan)' }}>.</span><span style={{ color: 'var(--neon-amber)' }}>lol</span>
          </div>
          <div style={{ marginBottom: 12 }}>made with neon and bad geography · MIT · v0.2</div>
          <div style={{ marginBottom: 16, color: 'var(--text-mute)' }}>
            no subscription · no paywall · no green
          </div>
          <a
            href="https://github.com/Julle98/geoguessr.lol"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.1em',
              textTransform: 'uppercase', textDecoration: 'none',
              padding: '8px 16px', borderRadius: 4,
              border: '1px solid var(--line)',
              color: 'var(--text-mute)',
              transition: 'all .15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--neon-cyan)'
              el.style.color = 'var(--neon-cyan)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--line)'
              el.style.color = 'var(--text-mute)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            github.com/Julle98/geoguessr.lol
          </a>
        </footer>
      </div>
    </>
  )
}

const navLink: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
  padding: '8px 14px', color: 'var(--text-mute)',
  textDecoration: 'none', textTransform: 'uppercase',
}

function ModeCard({ mode }: { mode: typeof GAME_MODES[0] }) {
  const tint = TINT[mode.color] || 'var(--neon-magenta)'
  const inner = (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-base) 100%)',
      border: `1px solid ${mode.disabled ? 'var(--line)' : 'var(--line)'}`,
      borderRadius: 8, padding: 18, overflow: 'hidden',
      transition: 'transform .15s, border-color .15s, box-shadow .15s',
      height: '100%', display: 'flex', flexDirection: 'column',
      opacity: mode.disabled ? 0.5 : 1,
      cursor: mode.disabled ? 'default' : 'pointer',
    }}
    onMouseEnter={e => {
      if (mode.disabled) return
      const el = e.currentTarget as HTMLElement
      el.style.transform = 'translateY(-2px)'
      el.style.borderColor = tint
      el.style.boxShadow = `0 6px 24px -8px ${tint}`
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.transform = ''
      el.style.borderColor = 'var(--line)'
      el.style.boxShadow = ''
    }}
    >
      {/* tint bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 100% 0%, ${tint} 0%, transparent 55%)`,
        opacity: .12, pointerEvents: 'none',
      }} />

      {/* badges */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
        {mode.hot && (
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.12em',
            padding: '4px 8px', borderRadius: 3, textTransform: 'uppercase',
            color: 'var(--neon-coral)', background: 'rgba(255,107,53,.1)',
            border: '1px solid rgba(255,107,53,.3)',
          }}>🔥 hot</span>
        )}
        {mode.disabled && !mode.hot && (
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.12em',
            padding: '4px 8px', borderRadius: 3, textTransform: 'uppercase',
            color: 'var(--text-mute)', background: 'rgba(255,255,255,.04)',
            border: '1px solid var(--line)',
          }}>tulossa</span>
        )}
      </div>

      <div style={{ fontSize: 34, filter: `drop-shadow(0 0 12px ${tint})`, marginBottom: 14 }}>{mode.icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-bright)', marginBottom: 4, margin: '0 0 4px' }}>
        {mode.name}
      </h3>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 10 }}>{mode.sub}</div>
      <p style={{ fontSize: 13, color: 'var(--text-base)', margin: 0, flex: 1 }}>{mode.desc}</p>
    </div>
  )

  if (mode.disabled) return <div>{inner}</div>
  return <Link href={mode.href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
}
