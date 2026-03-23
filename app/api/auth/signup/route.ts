import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword, createSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { email, password, whatsapp, nickname } = await req.json()

  if (!email?.includes('@'))
    return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 })
  if (!password || password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  if (!nickname || nickname.length < 3)
    return NextResponse.json({ error: 'Nickname must be at least 3 characters' }, { status: 400 })

  const cleanEmail    = email.toLowerCase().trim()
  const cleanNickname = nickname.toLowerCase().replace(/[^a-z0-9_]/g, '')

  // Check email not taken
  const { data: existingEmail } = await supabase
    .from('players').select('id').eq('email', cleanEmail).maybeSingle()
  if (existingEmail)
    return NextResponse.json({ error: 'Account already exists with this email' }, { status: 400 })

  // Check nickname not taken
  const { data: existingNick } = await supabase
    .from('players').select('id').eq('nickname', cleanNickname).maybeSingle()
  if (existingNick)
    return NextResponse.json({ error: 'Nickname already taken — try another' }, { status: 400 })

  const hash = await hashPassword(password)
  const { data: player, error } = await supabase
    .from('players')
    .insert({
      email:         cleanEmail,
      nickname:      cleanNickname,
      password_hash: hash,
      whatsapp:      whatsapp?.replace(/\D/g,'') ?? null,
      onboarded:     false,
      total_points:  0
    })
    .select('id').single()

  if (error || !player)
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 })

  const token    = await createSession(player.id)
  const response = NextResponse.json({ success: true, onboarded: false })
  response.cookies.set('lume_session', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 24 * 60 * 60,
    path:     '/'
  })
  response.cookies.set('lume_onboarded', '0', {
    httpOnly: false,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   30 * 24 * 60 * 60,
    path:     '/'
  })
  return response
}
