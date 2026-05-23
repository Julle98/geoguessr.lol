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
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-accent-green animate-pulse-slow">Ladataan...</div>
      </div>
    )
  }

  const user = session?.user as any

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <Link href="/" className="text-white/30 hover:text-white/60 font-body text-sm">← Takaisin</Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-white/30 hover:text-red-400 font-body text-sm transition-colors"
        >
          Kirjaudu ulos
        </button>
      </div>

      <div className="glass rounded-3xl p-8 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-green/20 flex items-center justify-center text-2xl font-display font-bold text-accent-green">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{user?.username}</h1>
            <p className="text-white/30 text-sm font-body">{user?.email}</p>
          </div>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard label="Pelejä pelattu" value={String(stats.totalGames)} />
            <StatCard label="Paras peli" value={`${stats.bestGame.toLocaleString('fi')} p`} />
            <StatCard label="Keskim. pisteet / peli" value={`${stats.avgScore.toLocaleString('fi')} p`} />
            <StatCard label="Keskim. etäisyys" value={formatDistance(stats.avgDistance)} />
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <span className="font-display text-sm font-bold text-white/50 tracking-widest uppercase">Pelihistoria</span>
            </div>
            {stats.games.length === 0 ? (
              <div className="px-6 py-8 text-center text-white/30 font-body text-sm">
                Ei pelejä vielä.{' '}
                <Link href="/play" className="text-accent-green hover:underline">Pelaa ensimmäinen!</Link>
              </div>
            ) : (
              stats.games.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0">
                  <div>
                    <div className="font-display font-bold text-white">{g.totalScore.toLocaleString('fi')} p</div>
                    <div className="text-white/30 text-xs font-body mt-0.5">
                      {g.rounds} kierrosta · {g.region} · {timeAgo(g.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-accent-green font-display font-bold text-sm">{g.avgScore.toLocaleString('fi')} p/kierros</div>
                    <div className="text-white/20 text-xs font-body">paras {g.bestRound.toLocaleString('fi')} p</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <div className="text-white/30 text-xs tracking-wide uppercase font-body mb-2">{label}</div>
      <div className="font-display text-2xl font-bold text-white">{value}</div>
    </div>
  )
}
