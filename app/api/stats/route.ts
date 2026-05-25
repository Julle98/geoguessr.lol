import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

    const userId = (session.user as any).id
    if (!userId) return NextResponse.json({ error: 'Virheellinen istunto' }, { status: 401 })

    const games = await prisma.gameSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { roundData: true },
    })

    const totalGames = games.length
    const totalScore = games.reduce((a, g) => a + g.totalScore, 0)
    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0
    const bestGame = totalGames > 0 ? Math.max(...games.map(g => g.totalScore)) : 0
    const allRounds = games.flatMap(g => g.roundData)
    const avgDistance = allRounds.length > 0
      ? Math.round(allRounds.reduce((a, r) => a + r.distanceKm, 0) / allRounds.length)
      : 0

    return NextResponse.json({ games, totalGames, avgScore, bestGame, avgDistance })
  } catch (err) {
    console.error('[/api/stats]', err)
    return NextResponse.json({ error: 'Palvelinvirhe' }, { status: 500 })
  }
}
