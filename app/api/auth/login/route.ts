import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPassword, createSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password)
    return NextResponse.json({ error: 'Enter your email and password' }, { status: 400 })

  const { data: player } = await supabase
    .from('players').select('id, password_hash, onboarded')
    .eq('email', email.toLowerCase().trim()).maybeSingle()

  if (!player)
    return NextResponse.json({ error: 'No account found with this email' }, { status: 400 })

  const valid = await verifyPassword(password, player.password_hash ?? '')
  if (!valid)
    return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })

  const token    = await createSession(player.id)
  const response = NextResponse.json({ success: true, onboarded: player.onboarded ?? false })
  response.cookies.set('lume_session', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/'
  })
  response.cookies.set('lume_onboarded', player.onboarded ? '1' : '0', {
    httpOnly: false, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 30 * 24 * 60 * 60, path: '/'
  })
  return response
}
