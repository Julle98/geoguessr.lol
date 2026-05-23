import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const { region, totalScore, rounds } = await req.json()
  const userId = (session.user as any).id

  const scores = rounds.map((r: any) => r.score)
  const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
  const bestRound = Math.max(...scores)

  const gameSession = await prisma.gameSession.create({
    data: {
      userId,
      region,
      totalScore,
      rounds: rounds.length,
      avgScore,
      bestRound,
      roundData: {
        create: rounds.map((r: any, i: number) => ({
          roundNumber: i + 1,
          actualLat: r.actual.lat,
          actualLng: r.actual.lng,
          guessLat: r.guess?.lat ?? 0,
          guessLng: r.guess?.lng ?? 0,
          score: r.score,
          distanceKm: r.distanceKm,
          timeMs: r.timeMs,
        })),
      },
    },
  })

  return NextResponse.json({ id: gameSession.id })
}
