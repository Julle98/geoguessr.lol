import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, mode, region, totalRounds, timeLimitSecs, hostName } = await req.json()

  if (!code || !hostName) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const existing = await prisma.party.findUnique({ where: { code } })
  if (existing) {
    // Party already created (host re-clicked) — just return existing
    const host = await prisma.partyMember.findFirst({ where: { partyId: existing.id }, orderBy: { joinedAt: 'asc' } })
    return NextResponse.json({ partyId: existing.id, memberId: host?.id })
  }

  const party = await prisma.party.create({
    data: { code, mode: mode ?? 'classic', region: region ?? 'world', totalRounds: totalRounds ?? 5, timeLimitSecs: timeLimitSecs ?? null },
  })

  const member = await prisma.partyMember.create({
    data: { partyId: party.id, name: hostName, color: PLAYER_COLORS[0] },
  })

  return NextResponse.json({ partyId: party.id, memberId: member.id })
}

const PLAYER_COLORS = ['#4ade80', '#ff2d95', '#00f0ff', '#ffd60a', '#a855f7', '#f97316', '#ec4899', '#06b6d4']
