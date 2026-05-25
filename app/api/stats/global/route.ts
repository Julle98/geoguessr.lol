import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [totalGames, totalUsers, topScoreAgg, recentSessions] = await Promise.all([
      prisma.gameSession.count(),
      prisma.user.count(),
      prisma.gameSession.aggregate({ _max: { totalScore: true } }),
      prisma.gameSession.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          totalScore: true,
          rounds: true,
          region: true,
          user: { select: { username: true } },
        },
      }),
    ])

    const topScore = topScoreAgg._max.totalScore ?? 0

    const tickerItems = recentSessions
      .filter(s => s.user)
      .map(s => {
        const score = s.totalScore.toLocaleString('fi')
        const region = regionLabel(s.region)
        return `${s.user.username} pelasi ${region} — ${score} pistettä (${s.rounds} kierrosta)`
      })

    return NextResponse.json({ totalGames, totalUsers, topScore, tickerItems })
  } catch (err) {
    console.error('[/api/stats/global]', err)
    return NextResponse.json({ totalGames: 0, totalUsers: 0, topScore: 0, tickerItems: [] })
  }
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