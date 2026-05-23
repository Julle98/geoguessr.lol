'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) setError('Väärä sähköposti tai salasana')
    else router.push('/')
  }

  return (
    <>
      <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>

          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em', color: 'var(--text-mute)', textDecoration: 'none', textTransform: 'uppercase', marginBottom: 36 }}>
            ← Takaisin
          </Link>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--neon-cyan)', textTransform: 'uppercase', textShadow: '0 0 6px rgba(0,240,255,.45)', marginBottom: 8 }}>
            // kirjaudu
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--text-bright)', margin: '0 0 8px', lineHeight: 1 }}>
            <span style={{ color: 'var(--neon-magenta)', textShadow: 'var(--glow-mag)' }}>Tervetuloa</span> takaisin.
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-mute)', margin: '0 0 28px' }}>
            Tallenna pisteet ja seuraa tilastojasi.
          </p>

          <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.9), rgba(21,10,54,.9))', border: '1px solid var(--line)', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {error && (
              <div style={{ background: 'rgba(255,45,100,.08)', border: '1px solid rgba(255,45,100,.35)', borderRadius: 6, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ff6b8a' }}>
                ⚠ {error}
              </div>
            )}

            <Field label="Sähköposti">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="sinä@esimerkki.fi"
                style={inputStyle}
              />
            </Field>

            <Field label="Salasana">
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>

            <button
              onClick={handleLogin} disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase',
                background: loading ? 'rgba(255,45,149,.4)' : 'linear-gradient(180deg, var(--neon-magenta), #c61878)',
                color: 'white', boxShadow: loading ? 'none' : '0 0 0 2px rgba(255,255,255,.1) inset, 0 4px 0 #7a0c46, 0 0 24px rgba(255,45,149,.5)',
                opacity: loading ? 0.7 : 1, marginTop: 4,
              }}
            >
              {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
            </button>

            <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', margin: 0 }}>
              Ei tiliä?{' '}
              <Link href="/register" style={{ color: 'var(--neon-cyan)', textDecoration: 'none' }}>Rekisteröidy →</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.15em', color: 'var(--text-mute)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 6, border: '1px solid var(--line)',
  background: 'rgba(7,2,26,.6)', color: 'var(--text-bright)',
  fontFamily: 'var(--font-body)', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
}
