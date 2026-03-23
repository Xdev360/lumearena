import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPlayerFromCookie } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET() {
  const auth = await getPlayerFromCookie()
  if (!auth) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: player } = await supabase
    .from('players')
    .select('id, full_name, nickname, avatar_url, whatsapp')
    .eq('id', auth.id)
    .single()

  return NextResponse.json({ player: player ?? auth })
}
