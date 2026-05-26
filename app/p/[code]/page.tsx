'use client'
import { useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  return <Suspense><JoinPageInner /></Suspense>
}

function JoinPageInner() {
  const params = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = (session?.user as any)

  const code = params.code as string
  const [playerName, setPlayerName] = useState(user?.username ?? '')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  // Update name field when session loads
  if (user?.username && !playerName) setPlayerName(user.username)

  async function join() {
    const name = playerName.trim()
    if (!name) { setError('Syötä nimi ennen liittymistä.'); return }
    setJoining(true)
    setError('')

    const res = await fetch(`/api/party/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error === 'party not found' ? 'Partyä ei löydy. Tarkista koodi.' : data.error === 'game already started' ? 'Peli on jo käynnissä.' : 'Jokin meni pieleen.')
      setJoining(false)
      return
    }

    const { memberId } = await res.json()
    router.push(`/party/${code}/play?mid=${memberId}`)
  }

  return (
    <>
      <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

        <div style={{ maxWidth: 400, width: '100%' }}>

          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em', color: 'var(--text-mute)', textDecoration: 'none', textTransform: 'uppercase', marginBottom: 32 }}>
            ← geoguessr.lol
          </Link>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--neon-cyan)', textTransform: 'uppercase', textShadow: '0 0 6px rgba(0,240,255,.45)', marginBottom: 8 }}>
            // party · liity
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 42, color: 'var(--text-bright)', margin: '0 0 4px', lineHeight: 1 }}>
            Liity peliin
          </h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--neon-cyan)', textShadow: '0 0 8px rgba(0,240,255,.4)', marginBottom: 28 }}>
            {code}
          </div>

          <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.9), rgba(21,10,54,.9))', border: '1px solid var(--line)', borderRadius: 10, padding: 24, marginBottom: 16 }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.15em', color: 'var(--text-mute)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Nimesi pelissä
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && join()}
              maxLength={20}
              placeholder="Syötä nimi…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px', borderRadius: 6,
                background: 'rgba(255,255,255,.05)', border: '1px solid var(--line)',
                fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-bright)',
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(255,107,53,.08)', border: '1px solid rgba(255,107,53,.3)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--neon-coral)' }}>
              ⚠ {error}
            </div>
          )}

          {status !== 'loading' && !user && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--line)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
              <span style={{ color: 'var(--neon-amber)' }}>ⓘ</span> Pelaat vieraana — tuloksia ei tallenneta. <Link href={`/login?next=/p/${code}`} style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>Kirjaudu →</Link>
            </div>
          )}

          <button
            onClick={join}
            disabled={joining || !playerName.trim()}
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              background: joining || !playerName.trim() ? 'rgba(255,255,255,.06)' : 'linear-gradient(180deg, var(--neon-magenta), #c61878)',
              color: joining || !playerName.trim() ? 'var(--text-dim)' : 'white',
              border: 'none', borderRadius: 6, cursor: joining || !playerName.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '.08em',
              padding: '18px', textTransform: 'uppercase',
              boxShadow: joining || !playerName.trim() ? 'none' : '0 0 0 2px rgba(255,255,255,.1) inset, 0 4px 0 #7a0c46, 0 0 24px rgba(255,45,149,.5)',
              marginBottom: 10, transition: 'all .15s',
            }}
          >
            {joining ? 'Liitytään…' : '▶ Liity peliin'}
          </button>

          <Link href="/" style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em', padding: '12px', borderRadius: 4, border: '1px solid var(--line)', color: 'var(--text-mute)', textDecoration: 'none', textTransform: 'uppercase' }}>
            ← Takaisin etusivulle
          </Link>
        </div>
      </div>
    </>
  )
}
