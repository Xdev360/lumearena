import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const adminAuth = req.cookies.get('lume_admin')?.value
  if (!adminAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { player_id } = await req.json()
  if (!player_id) return NextResponse.json({ error: 'player_id required' }, { status: 400 })

  const { data: regs } = await supabase.from('registrations').select('id').eq('player_id', player_id)
  const regIds = regs?.map(r => r.id) ?? []
  if (regIds.length) {
    await supabase.from('payments').delete().in('registration_id', regIds)
  }
  await supabase.from('sessions').delete().eq('player_id', player_id)
  await supabase.from('registrations').delete().eq('player_id', player_id)
  await supabase.from('notifications').delete().eq('player_id', player_id)
  await supabase.from('points_log').delete().eq('player_id', player_id)
  await supabase.from('players').delete().eq('id', player_id)

  return NextResponse.json({ success: true })
}
