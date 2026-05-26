import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLocationForParty } from '@/lib/partyLocations'

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { memberId } = await req.json()

  const party = await prisma.party.findUnique({ where: { code: params.code }, include: { members: true } })
  if (!party) return NextResponse.json({ error: 'party not found' }, { status: 404 })

  // Only the host (first member) can start
  const isHost = party.members[0]?.id === memberId
  if (!isHost) return NextResponse.json({ error: 'not host' }, { status: 403 })
  if (party.phase !== 'waiting') return NextResponse.json({ error: 'already started' }, { status: 409 })

  const loc = getLocationForParty(party.mode, party.region, party.id, 1)

  await prisma.party.update({
    where: { id: party.id },
    data: { phase: 'playing', currentRound: 1, actualLat: loc.lat, actualLng: loc.lng, roundStartedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
