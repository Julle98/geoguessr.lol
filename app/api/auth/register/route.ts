import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { email, username, password } = await req.json()

  if (!email || !username || !password)
    return NextResponse.json({ error: 'Täytä kaikki kentät' }, { status: 400 })

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (exists)
    return NextResponse.json({ error: 'Sähköposti tai käyttäjänimi on jo käytössä' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  })

  return NextResponse.json({ id: user.id, username: user.username })
}
