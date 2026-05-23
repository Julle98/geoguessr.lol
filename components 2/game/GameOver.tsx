'use client'
import type { Round } from '@/lib/gameStore'
import Link from 'next/link'

interface GameOverProps {
  totalScore: number
  rounds: Round[]
  onPlayAgain: () => void
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('fi')} km`
}

function getRank(score: number): { rank: string; emoji: string } {
  const total = score
  if (total >= 22000) return { rank: 'Kartografi', emoji: '🌍' }
  if (total >= 18000) return { rank: 'Tutkimusmatkailija', emoji: '🧭' }
  if (total >= 14000) return { rank: 'Seikkailija', emoji: '🗺️' }
  if (total >= 10000) return { rank: 'Turisti', emoji: '✈️' }
  if (total >= 5000)  return { rank: 'Eksyksissä', emoji: '🤔' }
  return { rank: 'GPS-riippuvainen', emoji: '😅' }
}

export function GameOver({ totalScore, rounds, onPlayAgain }: GameOverProps) {
  const { rank, emoji } = getRank(totalScore)
  const maxPossible = rounds.length * 5000
  const pct = Math.round((totalScore / maxPossible) * 100)
  const avgDistance = rounds.reduce((a, r) => a + r.distanceKm, 0) / rounds.length
  const bestRound = rounds.reduce((a, r) => (r.score > a.score ? r : a), rounds[0])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">

      <div className="max-w-lg w-full">

        {/* Rank */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="text-6xl mb-4">{emoji}</div>
          <div className="text-white/40 text-xs tracking-[0.3em] uppercase font-body mb-2">Sinut arvioitiin</div>
          <h2 className="font-display text-4xl font-extrabold gradient-text">{rank}</h2>
        </div>

        {/* Total score */}
        <div className="glass rounded-3xl p-8 mb-6 text-center animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="text-white/30 text-xs tracking-widest uppercase font-body mb-2">Kokonaispisteet</div>
          <div className="font-display text-7xl font-extrabold gradient-text mb-2">
            {totalScore.toLocaleString('fi')}
          </div>
          <div className="text-white/30 text-sm font-body">/ {maxPossible.toLocaleString('fi')} ({pct}%)</div>

          {/* Score bar */}
          <div className="mt-4 h-2 bg-earth-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-green to-accent-lime rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <StatCard label="Paras kierros" value={`${bestRound.score.toLocaleString('fi')} p`} />
          <StatCard label="Keskim. etäisyys" value={formatDistance(avgDistance)} />
        </div>

        {/* Round breakdown */}
        <div className="glass rounded-2xl overflow-hidden mb-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div className="px-5 py-3 border-b border-white/5">
            <span className="text-xs font-display tracking-widest uppercase text-white/30">Kierroksittain</span>
          </div>
          {rounds.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0">
              <div className="text-white/40 text-sm font-body">Kierros {i + 1}</div>
              <div className="flex items-center gap-4">
                <span className="text-white/30 text-xs font-body">{formatDistance(r.distanceKm)}</span>
                <span
                  className="font-display font-bold text-sm"
                  style={{ color: r.score >= 4000 ? '#4ade80' : r.score >= 2000 ? '#fbbf24' : '#f87171' }}
                >
                  {r.score.toLocaleString('fi')} p
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 rounded-2xl font-display font-bold text-base bg-accent-green text-earth-900
              hover:bg-accent-lime active:scale-95 transition-all duration-150"
          >
            Pelaa uudelleen
          </button>
          <Link
            href="/"
            className="flex-1 py-4 rounded-2xl font-display font-bold text-base glass text-white/70
              hover:text-white hover:border-white/20 active:scale-95 transition-all duration-150 text-center border border-white/10"
          >
            Päävalikko
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <div className="text-white/30 text-xs tracking-wide uppercase font-body mb-2">{label}</div>
      <div className="font-display text-xl font-bold text-white">{value}</div>
    </div>
  )
}
