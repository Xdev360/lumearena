import { NextResponse } from 'next/server'
import { getPlayerFromCookie } from '@/lib/auth'

export async function GET() {
  const player = await getPlayerFromCookie()
  if (!player) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  return NextResponse.json({ player })
}
