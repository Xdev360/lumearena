import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get('game')
  if (!game) return NextResponse.json({ batch: null })

  const { data: week } = await supabase
    .from('weeks')
    .select('week_number')
    .eq('status', 'open')
    .single()

  if (!week) return NextResponse.json({ batch: null })

  const { data: batch } = await supabase
    .from('batches')
    .select('id, label, slots_filled, max_slots, status')
    .eq('game', game)
    .eq('week_number', week.week_number)
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  return NextResponse.json({ batch, week_number: week.week_number })
}
