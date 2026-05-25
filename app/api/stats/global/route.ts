import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [totalGames, totalUsers, topScoreAgg, recentSessions] = await Promise.all([
    prisma.gameSession.count(),
    prisma.user.count(),
    prisma.gameSession.aggregate({ _max: { totalScore: true } }),
    prisma.gameSession.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        totalScore: true,
        bestRound: true,
        rounds: true,
        region: true,
        createdAt: true,
        user: { select: { username: true } },
      },
    }),
  ])

  const topScore = topScoreAgg._max.totalScore ?? 0

  const tickerItems = recentSessions.map(s => {
    const score = s.totalScore.toLocaleString('fi')
    const region = regionLabel(s.region)
    return `${s.user.username} pelasi ${region} — ${score} pistettä (${s.rounds} kierrosta)`
  })

  return NextResponse.json({
    totalGames,
    totalUsers,
    topScore,
    tickerItems,
  })
}

function regionLabel(region: string): string {
  const map: Record<string, string> = {
    world: 'Maailma',
    europe: 'Eurooppa',
    asia: 'Aasia',
    americas: 'Amerikat',
    africa: 'Afrikka',
  }
  return map[region] ?? region
}