import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLocationForParty } from '@/lib/partyLocations'
import { haversine, calculateScore } from '@/lib/gameStore'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const memberId = req.nextUrl.searchParams.get('memberId')

  const party = await prisma.party.findUnique({
    where: { code: params.code },
    include: {
      members: { orderBy: { joinedAt: 'asc' } },
      guesses: true,
    },
  })
  if (!party) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Update lastSeenAt for this member
  if (memberId) {
    await prisma.partyMember.updateMany({
      where: { id: memberId, partyId: party.id },
      data: { lastSeenAt: new Date() },
    })
  }

  // Auto-advance: if timer expired and phase is still 'playing', lock missing guesses and move to round_result
  if (party.phase === 'playing' && party.timeLimitSecs && party.roundStartedAt) {
    const elapsed = (Date.now() - party.roundStartedAt.getTime()) / 1000
    if (elapsed >= party.timeLimitSecs) {
      await advanceRound(party)
      const updated = await prisma.party.findUnique({
        where: { code: params.code },
        include: { members: { orderBy: { joinedAt: 'asc' } }, guesses: true },
      })
      return NextResponse.json(buildState(updated!))
    }
  }

  return NextResponse.json(buildState(party))
}

// Host calls this to advance to next round
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { memberId } = await req.json()

  const party = await prisma.party.findUnique({
    where: { code: params.code },
    include: { members: { orderBy: { joinedAt: 'asc' } }, guesses: true },
  })
  if (!party) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const isHost = party.members[0]?.id === memberId
  if (!isHost) return NextResponse.json({ error: 'not host' }, { status: 403 })
  if (party.phase !== 'round_result') return NextResponse.json({ error: 'wrong phase' }, { status: 409 })

  if (party.currentRound >= party.totalRounds) {
    await prisma.party.update({ where: { id: party.id }, data: { phase: 'game_over' } })
  } else {
    const nextRound = party.currentRound + 1
    const loc = getLocationForParty(party.mode, party.region, party.id, nextRound)
    await prisma.party.update({
      where: { id: party.id },
      data: { phase: 'playing', currentRound: nextRound, actualLat: loc.lat, actualLng: loc.lng, roundStartedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}

async function advanceRound(party: any) {
  if (!party.actualLat || !party.actualLng) return

  const actual = { lat: party.actualLat, lng: party.actualLng }
  const roundGuesses = party.guesses.filter((g: any) => g.round === party.currentRound)
  const guessedMemberIds = new Set(roundGuesses.map((g: any) => g.memberId))

  // Fill missing guesses with (0,0) — zero score
  const missing = party.members.filter((m: any) => !guessedMemberIds.has(m.id))
  for (const m of missing) {
    await prisma.partyGuess.create({
      data: {
        partyId: party.id, memberId: m.id, round: party.currentRound,
        guessLat: 0, guessLng: 0, score: 0, distanceKm: 20000,
      },
    })
  }

  await prisma.party.update({ where: { id: party.id }, data: { phase: 'round_result' } })
}

function buildState(party: any) {
  const roundGuesses = party.guesses.filter((g: any) => g.round === party.currentRound)
  const lockedIds = new Set(roundGuesses.map((g: any) => g.memberId))

  const members = party.members.map((m: any) => ({
    id: m.id, name: m.name, color: m.color, totalScore: m.totalScore,
    locked: lockedIds.has(m.id),
    active: (Date.now() - new Date(m.lastSeenAt).getTime()) < 8000,
  }))

  const roundResult = party.phase === 'round_result' || party.phase === 'game_over'
    ? roundGuesses.map((g: any) => {
        const member = party.members.find((m: any) => m.id === g.memberId)
        return {
          memberId: g.memberId, name: member?.name ?? '?', color: member?.color ?? '#fff',
          guessLat: g.guessLat, guessLng: g.guessLng, score: g.score, distanceKm: g.distanceKm,
        }
      }).sort((a: any, b: any) => b.score - a.score)
    : null

  // Build per-round history for game_over screen
  const allRoundsHistory = party.phase === 'game_over'
    ? buildRoundsHistory(party)
    : null

  return {
    phase: party.phase,
    currentRound: party.currentRound,
    totalRounds: party.totalRounds,
    timeLimitSecs: party.timeLimitSecs,
    roundStartedAt: party.roundStartedAt,
    actualLat: party.phase === 'round_result' || party.phase === 'game_over' ? party.actualLat : null,
    actualLng: party.phase === 'round_result' || party.phase === 'game_over' ? party.actualLng : null,
    playingLat: party.phase === 'playing' ? party.actualLat : null,
    playingLng: party.phase === 'playing' ? party.actualLng : null,
    members,
    roundResult,
    allRoundsHistory,
  }
}

function buildRoundsHistory(party: any) {
  const history: any[] = []
  for (let r = 1; r <= party.currentRound; r++) {
    const guesses = party.guesses
      .filter((g: any) => g.round === r)
      .map((g: any) => {
        const member = party.members.find((m: any) => m.id === g.memberId)
        return { memberId: g.memberId, name: member?.name ?? '?', color: member?.color ?? '#fff', score: g.score, distanceKm: g.distanceKm }
      })
    history.push({ round: r, guesses })
  }
  return history
}
