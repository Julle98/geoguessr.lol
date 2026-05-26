import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { haversine, calculateScore } from '@/lib/gameStore'

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { memberId, guessLat, guessLng } = await req.json()
  if (!memberId || guessLat == null || guessLng == null) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const party = await prisma.party.findUnique({
    where: { code: params.code },
    include: { members: { orderBy: { joinedAt: 'asc' } }, guesses: true },
  })
  if (!party) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (party.phase !== 'playing') return NextResponse.json({ error: 'wrong phase' }, { status: 409 })
  if (!party.actualLat || !party.actualLng) return NextResponse.json({ error: 'no location' }, { status: 409 })

  // Prevent double-submitting
  const already = party.guesses.find(g => g.memberId === memberId && g.round === party.currentRound)
  if (already) return NextResponse.json({ ok: true, score: already.score })

  const actual = { lat: party.actualLat, lng: party.actualLng }
  const guess = { lat: guessLat, lng: guessLng }
  const distanceKm = haversine(actual, guess)
  const score = calculateScore(distanceKm)

  await prisma.partyGuess.create({
    data: { partyId: party.id, memberId, round: party.currentRound, guessLat, guessLng, score, distanceKm },
  })

  // Update member total score
  await prisma.partyMember.update({
    where: { id: memberId },
    data: { totalScore: { increment: score } },
  })

  // Check if all active members have guessed
  const recentCutoff = new Date(Date.now() - 8000)
  const activeMembers = party.members.filter(m => m.lastSeenAt >= recentCutoff)
  const roundGuesses = [...party.guesses.filter(g => g.round === party.currentRound), { memberId }]
  const guessedIds = new Set(roundGuesses.map(g => g.memberId))
  const allGuessed = activeMembers.every(m => guessedIds.has(m.id))

  if (allGuessed) {
    await prisma.party.update({ where: { id: party.id }, data: { phase: 'round_result' } })
  }

  return NextResponse.json({ ok: true, score, distanceKm })
}
