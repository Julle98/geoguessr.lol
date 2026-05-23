import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const topUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      gameSessions: {
        select: { totalScore: true, bestRound: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const rows = topUsers
    .map(u => {
      const games = u.gameSessions
      if (games.length === 0) return null
      const best = Math.max(...games.map(g => g.totalScore))
      const total = games.reduce((a, g) => a + g.totalScore, 0)
      const avg = Math.round(total / games.length)
      const bestRound = Math.max(...games.map(g => g.bestRound))
      return { id: u.id, username: u.username, bestGame: best, avgScore: avg, totalGames: games.length, bestRound }
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.bestGame - a.bestGame)
    .slice(0, 100)
    .map((r: any, i) => ({ ...r, rank: i + 1 }))

  return NextResponse.json(rows)
}
