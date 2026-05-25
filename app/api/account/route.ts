import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()

  // Password change
  if (body.currentPassword !== undefined) {
    const { currentPassword, newPassword } = body
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: 'Täytä kaikki kentät' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Käyttäjää ei löydy' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Nykyinen salasana on väärä' }, { status: 400 })

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return NextResponse.json({ ok: true })
  }

  // Profile update
  const { username, email } = body
  if (!username && !email)
    return NextResponse.json({ error: 'Ei muutoksia' }, { status: 400 })

  const conflict = await prisma.user.findFirst({
    where: {
      AND: [
        { id: { not: userId } },
        { OR: [...(username ? [{ username }] : []), ...(email ? [{ email }] : [])] },
      ],
    },
  })
  if (conflict)
    return NextResponse.json({ error: 'Käyttäjänimi tai sähköposti on jo käytössä' }, { status: 400 })

  await prisma.user.update({
    where: { id: userId },
    data: { ...(username ? { username } : {}), ...(email ? { email } : {}) },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Ei kirjautunut' }, { status: 401 })

  const userId = (session.user as any).id
  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
