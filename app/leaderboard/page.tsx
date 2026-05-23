'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Row = {
  rank: number; id: string; username: string
  bestGame: number; avgScore: number; totalGames: number; bestRound: number
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const me = (session?.user as any)?.id
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'best' | 'avg'>('best')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const sorted = [...rows].sort((a, b) =>
    tab === 'best' ? b.bestGame - a.bestGame : b.avgScore - a.avgScore
  ).map((r, i) => ({ ...r, rank: i + 1 }))

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
            <Link href="/play" style={navLink}>▶ Pelaa</Link>
            {session
              ? <Link href="/profile" style={navLink}>Profiili</Link>
              : <Link href="/login" style={navLink}>Kirjaudu</Link>
            }
          </div>
        </nav>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--neon-cyan)', textTransform: 'uppercase', textShadow: '0 0 6px rgba(0,240,255,.45)', marginBottom: 6 }}>
              // ranks · pelaa enemmän, nouse korkeammalle
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, margin: 0, lineHeight: 1 }}>
              <span style={{ color: 'var(--neon-amber)', textShadow: 'var(--glow-amber)' }}>top</span>{' '}
              <span style={{ color: 'var(--text-bright)' }}>100</span>
            </h1>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {(['best', 'avg'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.1em',
                padding: '8px 18px', borderRadius: 4, cursor: 'pointer',
                textTransform: 'uppercase',
                background: tab === t ? 'rgba(255,214,10,.12)' : 'rgba(255,255,255,.04)',
                color: tab === t ? 'var(--neon-amber)' : 'var(--text-mute)',
                border: tab === t ? '1px solid var(--neon-amber)' : '1px solid var(--line)',
                boxShadow: tab === t ? '0 0 10px rgba(255,214,10,.35)' : 'none',
                transition: 'all .15s',
              }}>
                {t === 'best' ? '🏆 Paras peli' : '📊 Keskiarvo'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.85), rgba(21,10,54,.85))', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--neon-amber)', textShadow: '0 0 8px rgba(255,214,10,.4)' }}>
              // global · {tab === 'best' ? 'paras tulos' : 'keskipisteet'}
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-display)', color: 'var(--text-mute)', letterSpacing: '.2em' }}>
                LADATAAN...
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-mute)', fontSize: 13 }}>
                Ei pelaajia vielä.{' '}
                <Link href="/play" style={{ color: 'var(--neon-cyan)' }}>Ole ensimmäinen!</Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', padding: '4px 8px' }}>
                <thead>
                  <tr style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.15em', textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '0 8px', width: 44 }}>#</th>
                    <th style={{ padding: '0 8px' }}>pelaaja</th>
                    <th style={{ padding: '0 8px', textAlign: 'right' }}>pelejä</th>
                    <th style={{ padding: '0 8px', textAlign: 'right' }}>paras kierros</th>
                    <th style={{ padding: '0 8px', textAlign: 'right' }}>{tab === 'best' ? 'paras peli' : 'keskiarvo'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => {
                    const isMe = r.id === me
                    return (
                      <tr key={r.id} style={{ background: isMe ? 'rgba(255,45,149,.1)' : 'rgba(255,255,255,.015)' }}>
                        <td style={{ padding: '12px 8px', borderTop: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderBottom: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderLeft: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderRadius: '4px 0 0 4px' }}>
                          <span style={{
                            fontFamily: 'var(--font-display)', fontSize: 18, display: 'inline-block', width: '100%', textAlign: 'center',
                            color: r.rank === 1 ? 'var(--neon-amber)' : r.rank === 2 ? '#cfd2dd' : r.rank === 3 ? '#ff8a4d' : 'var(--text-mute)',
                            textShadow: r.rank <= 3 ? `0 0 8px currentColor` : 'none',
                          }}>
                            {r.rank === 1 ? '👑' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', borderTop: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderBottom: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              background: `linear-gradient(135deg, ${isMe ? 'var(--neon-magenta)' : '#5b8cff'}, #150a36)`,
                              display: 'grid', placeItems: 'center',
                              fontFamily: 'var(--font-display)', fontSize: 11, color: 'white',
                            }}>
                              {r.username[0].toUpperCase()}
                            </div>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: isMe ? 'var(--neon-magenta)' : 'var(--text-bright)' }}>
                              {r.username} {isMe && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>(sinä)</span>}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', borderTop: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderBottom: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}` }}>
                          {r.totalGames}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--neon-cyan)', borderTop: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderBottom: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}` }}>
                          {r.bestRound.toLocaleString('fi')}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--neon-amber)', textShadow: '0 0 8px rgba(255,214,10,.35)', borderTop: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderBottom: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderRight: `1px solid ${isMe ? 'rgba(255,45,149,.4)' : 'var(--line-soft)'}`, borderRadius: '0 4px 4px 0' }}>
                          {(tab === 'best' ? r.bestGame : r.avgScore).toLocaleString('fi')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* My rank callout */}
          {session && !loading && sorted.length > 0 && (() => {
            const mine = sorted.find(r => r.id === me)
            if (!mine) return (
              <div style={{ marginTop: 18, padding: '14px 18px', background: 'rgba(255,45,149,.06)', border: '1px dashed rgba(255,45,149,.3)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', textAlign: 'center' }}>
                Sinua ei vielä listalla. <Link href="/play" style={{ color: 'var(--neon-magenta)' }}>Pelaa ensimmäinen peli!</Link>
              </div>
            )
            return (
              <div style={{ marginTop: 18, padding: '14px 18px', background: 'rgba(255,45,149,.08)', border: '1px solid rgba(255,45,149,.35)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--neon-magenta)', letterSpacing: '.15em', textTransform: 'uppercase' }}>
                  // sinun sijasi
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: 'var(--neon-magenta)', textShadow: 'var(--glow-mag)', lineHeight: 1 }}>
                  #{mine.rank}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', textAlign: 'right' }}>
                  <div style={{ color: 'var(--neon-amber)' }}>{(tab === 'best' ? mine.bestGame : mine.avgScore).toLocaleString('fi')} p</div>
                  <div>{mine.totalGames} peliä</div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}

const navLink: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
  padding: '8px 14px', borderRadius: 4, color: 'var(--text-mute)',
  textDecoration: 'none', textTransform: 'uppercase',
}
