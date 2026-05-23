'use client'
import { useEffect, useState } from 'react'

interface RoundTimerProps {
  seconds: number
  onExpire: () => void
  paused?: boolean
}

export function RoundTimer({ seconds, onExpire, paused = false }: RoundTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (paused) return
    if (remaining <= 0) {
      onExpire()
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, paused, onExpire])

  const pct = (remaining / seconds) * 100
  const isUrgent = remaining <= 15
  const color = isUrgent ? '#fbbf24' : '#4ade80'

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 15}`}
            strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-xs font-display font-bold`}
          style={{ color }}
        >
          {remaining}
        </span>
      </div>
    </div>
  )
}
