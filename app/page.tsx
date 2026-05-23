'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const TAGLINES = [
  'Missä maailmassa olet?',
  'Katso. Mieti. Arvaa.',
  'Maailma on pelikenttäsi.',
  'Jokainen kulma on arvoitus.',
]

export default function HomePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [tagline, setTagline] = useState(TAGLINES[0])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        i = (i + 1) % TAGLINES.length
        setTagline(TAGLINES[i])
        setVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Globe SVG */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <svg width="800" height="800" viewBox="0 0 800 800">
          <circle cx="400" cy="400" r="350" stroke="#4ade80" strokeWidth="1" fill="none" />
          <ellipse cx="400" cy="400" rx="180" ry="350" stroke="#4ade80" strokeWidth="1" fill="none" />
          <ellipse cx="400" cy="400" rx="350" ry="140" stroke="#4ade80" strokeWidth="1" fill="none" />
          <line x1="50" y1="400" x2="750" y2="400" stroke="#4ade80" strokeWidth="1" />
          <line x1="400" y1="50" x2="400" y2="750" stroke="#4ade80" strokeWidth="1" />
        </svg>
      </div>

      {/* Käyttäjänappi */}
      <div className="absolute top-5 right-5 flex items-center gap-3 z-10">
        {user ? (
          <Link href="/profile" className="glass rounded-xl px-4 py-2 text-sm font-display font-bold text-accent-green hover:bg-earth-700 transition-colors">
            {user.username} →
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-white/40 hover:text-white text-sm font-body transition-colors">Kirjaudu</Link>
            <Link href="/register" className="glass rounded-xl px-4 py-2 text-sm font-display font-bold text-accent-green hover:bg-earth-700 transition-colors">Rekisteröidy</Link>
          </>
        )}
      </div>

      {/* Hero */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <div className="mb-6 animate-fade-up" style={{ animationDelay: '0ms' }}>
          <span className="text-xs font-body tracking-[0.4em] uppercase text-accent-green/60">v0.1 — Early Access</span>
        </div>

        <h1 className="font-display text-7xl md:text-9xl font-extrabold leading-none mb-4 animate-fade-up gradient-text" style={{ animationDelay: '100ms' }}>
          GeoGame
        </h1>

        <p className={`font-body text-xl md:text-2xl text-white/50 mb-12 h-8 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          {tagline}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <GameModeCard href="/play" icon="🌍" title="Street View" description="Arvaa sijainti Street View -kuvasta" badge="PÄÄPELI" primary />
          <GameModeCard href="/play?mode=flags" icon="🚩" title="Lippuvisa" description="Tunnista maiden liput" badge="TULOSSA" disabled />
          <GameModeCard href="/play?mode=borders" icon="🗺️" title="Rajat" description="Missä maiden rajat kulkevat?" badge="TULOSSA" disabled />
        </div>
      </div>
    </main>
  )
}

function GameModeCard({ href, icon, title, description, badge, primary, disabled }: {
  href: string; icon: string; title: string; description: string; badge: string; primary?: boolean; disabled?: boolean
}) {
  const inner = (
    <div className={`relative glass rounded-2xl p-6 text-left transition-all duration-300 h-full
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent-green/40 hover:bg-earth-700/80 hover:-translate-y-1 cursor-pointer group'}`}>
      <span className={`absolute top-3 right-3 text-[10px] font-display tracking-widest px-2 py-0.5 rounded-full
        ${primary ? 'bg-accent-green/20 text-accent-green' : 'bg-white/10 text-white/40'}`}>
        {badge}
      </span>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className={`font-display text-xl font-bold mb-1 ${primary ? 'text-accent-green' : 'text-white'}`}>{title}</h3>
      <p className="text-white/50 text-sm font-body leading-relaxed">{description}</p>
      {!disabled && (
        <div className={`mt-4 text-xs font-display tracking-widest uppercase ${primary ? 'text-accent-green' : 'text-white/30'} group-hover:translate-x-1 transition-transform duration-200`}>
          Pelaa →
        </div>
      )}
    </div>
  )
  if (disabled) return inner
  return <Link href={href} className="block">{inner}</Link>
}
