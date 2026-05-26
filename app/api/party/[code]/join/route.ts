import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PLAYER_COLORS = ['#4ade80', '#ff2d95', '#00f0ff', '#ffd60a', '#a855f7', '#f97316', '#ec4899', '#06b6d4']

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: 'missing name' }, { status: 400 })

  const party = await prisma.party.findUnique({ where: { code: params.code }, include: { members: true } })
  if (!party) return NextResponse.json({ error: 'party not found' }, { status: 404 })
  if (party.phase !== 'waiting') return NextResponse.json({ error: 'game already started' }, { status: 409 })

  const colorIndex = party.members.length % PLAYER_COLORS.length
  const member = await prisma.partyMember.create({
    data: { partyId: party.id, name, color: PLAYER_COLORS[colorIndex] },
  })

  return NextResponse.json({ memberId: member.id, partyId: party.id })
}
