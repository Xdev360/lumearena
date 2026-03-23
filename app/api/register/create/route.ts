import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPlayerFromCookie } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const player = await getPlayerFromCookie()
  if (!player) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { full_name, game, week_number } = await req.json()

  // Check week is still open
  const { data: week } = await supabase
    .from('weeks')
    .select('status, week_number')
    .eq('week_number', week_number)
    .single()

  if (!week || week.status !== 'open')
    return NextResponse.json({ error: 'Registrations are closed' }, { status: 400 })

  // Check duplicate — same player, same game, same week
  const { data: existing } = await supabase
    .from('registrations')
    .select('id, payment_status')
    .eq('player_id', player.id)
    .eq('game', game)
    .eq('week_number', week_number)
    .not('payment_status', 'eq', 'failed')
    .maybeSingle()

  if (existing)
    return NextResponse.json({
      error: 'You already have a registration for this game this week',
      existing_id: existing.id
    }, { status: 400 })

  // Update player name if not set
  if (full_name && !player.full_name) {
    await supabase.from('players')
      .update({ full_name })
      .eq('id', player.id)
  }

  // Generate unique payment reference
  const reference = `LUME-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`

  // Create registration
  const { data: reg, error: regErr } = await supabase
    .from('registrations')
    .insert({
      player_id:      player.id,
      full_name:      full_name || player.full_name || 'Player',
      whatsapp:       player.whatsapp,
      game,
      week_number,
      payment_status: 'pending'
    })
    .select()
    .single()

  if (regErr || !reg)
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 })

  // Create pending payment with 5-min expiry
  const expires = new Date(Date.now() + 5 * 60 * 1000)
  const { data: payment } = await supabase
    .from('payments')
    .insert({
      registration_id: reg.id,
      player_id:       player.id,
      full_name:       full_name || player.full_name || 'Player',
      whatsapp:        player.whatsapp,
      game,
      amount:          30000,
      status:          'pending',
      reference,
      expires_at:      expires.toISOString()
    })
    .select()
    .single()

  return NextResponse.json({
    success:         true,
    registration_id: reg.id,
    payment_id:      payment?.id,
    reference,
    expires_at:      expires.toISOString()
  })
}

