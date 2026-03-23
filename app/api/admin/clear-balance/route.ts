import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { player_id } = await req.json()

  await supabase.from('players').update({
    total_points:  0,
    total_wins:    0,
    total_losses:  0,
    total_matches: 0,
    total_prizes:  0,
  }).eq('id', player_id)

  await supabase.from('points_log').delete().eq('player_id', player_id)

  return NextResponse.json({ success: true })
}
