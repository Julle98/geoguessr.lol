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
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <h1 className="font-display text-4xl font-extrabold gradient-text mb-2">Kirjaudu</h1>
        <p className="text-white/40 font-body mb-8">Tallenna pisteet ja seuraa tilastojasi.</p>
        <div className="glass rounded-2xl p-6 space-y-4">
          {error && <div className="text-red-400 text-sm font-body bg-red-400/10 rounded-xl px-4 py-2">{error}</div>}
          <div>
            <label className="text-white/40 text-xs font-body block mb-1">Sähköposti</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-earth-800 border border-white/10 rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-accent-green/50 transition-colors"
              placeholder="sinä@esimerkki.fi"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs font-body block mb-1">Salasana</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-earth-800 border border-white/10 rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-accent-green/50 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-xl font-display font-bold bg-accent-green text-earth-900 hover:bg-accent-lime active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
          </button>
          <p className="text-center text-white/30 text-sm font-body">
            Ei tiliä?{' '}
            <Link href="/register" className="text-accent-green hover:underline">Rekisteröidy</Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-white/30 text-sm hover:text-white/60 font-body">← Takaisin</Link>
        </div>
      </div>
    </div>
  )
}
