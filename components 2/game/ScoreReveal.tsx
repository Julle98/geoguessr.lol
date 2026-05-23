'use client'
import { useEffect, useState } from 'react'

interface ScoreDisplayProps {
  score: number
  distanceKm: number
  totalScore: number
  round: number
  totalRounds: number
  onNext: () => void
  isLastRound: boolean
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km).toLocaleString('fi')} km`
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 4500) return { label: 'Mahtava! 🎯', color: 'text-accent-green' }
  if (score >= 3500) return { label: 'Hyvä! 👍', color: 'text-accent-lime' }
  if (score >= 2000) return { label: 'Ihan ok 😐', color: 'text-accent-gold' }
  if (score >= 500) return { label: 'Lähellä ei käy 😬', color: 'text-orange-400' }
  return { label: 'Sateliitti olisi avuksi 💀', color: 'text-red-400' }
}

export function ScoreReveal({
  score, distanceKm, totalScore, round, totalRounds, onNext, isLastRound,
}: ScoreDisplayProps) {
  const [shown, setShown] = useState(0)
  const { label, color } = getScoreLabel(score)

  // Animate score counting up
  useEffect(() => {
    const step = score / 60
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + step, score)
      setShown(Math.round(current))
      if (current >= score) clearInterval(interval)
    }, 16)
    return () => clearInterval(interval)
  }, [score])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 px-6 animate-fade-up">

      {/* Round indicator */}
      <div className="text-white/40 text-sm font-display tracking-widest uppercase">
        Kierros {round} / {totalRounds}
      </div>

      {/* Score label */}
      <div className={`text-2xl font-display font-bold ${color}`}>{label}</div>

      {/* Big score */}
      <div className="text-center">
        <div className="font-display text-8xl font-extrabold gradient-text animate-score-pop">
          {shown.toLocaleString('fi')}
        </div>
        <div className="text-white/30 text-sm mt-1 font-body">pistettä</div>
      </div>

      {/* Distance */}
      <div className="glass rounded-2xl px-8 py-4 text-center">
        <div className="text-white/50 text-xs font-body tracking-widest uppercase mb-1">Etäisyys oikeasta</div>
        <div className="font-display text-3xl font-bold text-white">{formatDistance(distanceKm)}</div>
      </div>

      {/* Total score */}
      <div className="text-white/40 text-sm font-body">
        Yhteensä: <span className="text-accent-green font-display font-bold">{totalScore.toLocaleString('fi')} p</span>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="mt-2 px-10 py-4 rounded-2xl font-display font-bold text-lg bg-accent-green text-earth-900
          hover:bg-accent-lime active:scale-95 transition-all duration-150 shadow-lg shadow-accent-green/20"
      >
        {isLastRound ? 'Näytä tulokset →' : 'Seuraava kierros →'}
      </button>
    </div>
  )
}
