import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [totalGames, totalUsers, topScore] = await Promise.all([
    prisma.gameSession.count(),
    prisma.user.count(),
    prisma.gameSession.aggregate({ _max: { totalScore: true } }),
  ])

  return NextResponse.json({
    totalGames,
    totalUsers,
    topScore: topScore._max.totalScore ?? 0,
  })
}
