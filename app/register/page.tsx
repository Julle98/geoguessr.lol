'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <h1 className="font-display text-4xl font-extrabold gradient-text mb-2">Rekisteröidy</h1>
        <p className="text-white/40 font-body mb-8">Luo tili ja aloita pisteiden kerääminen.</p>
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
            <label className="text-white/40 text-xs font-body block mb-1">Käyttäjänimi</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-earth-800 border border-white/10 rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-accent-green/50 transition-colors"
              placeholder="pelaaja123"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs font-body block mb-1">Salasana</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              className="w-full bg-earth-800 border border-white/10 rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-accent-green/50 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handleRegister} disabled={loading}
            className="w-full py-3 rounded-xl font-display font-bold bg-accent-green text-earth-900 hover:bg-accent-lime active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Luodaan tiliä...' : 'Luo tili'}
          </button>
          <p className="text-center text-white/30 text-sm font-body">
            Onko tili jo?{' '}
            <Link href="/login" className="text-accent-green hover:underline">Kirjaudu</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
