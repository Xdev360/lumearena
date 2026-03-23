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

  const { nickname, avatar_url, whatsapp } = await req.json()

  if (!nickname || nickname.length < 3)
    return NextResponse.json({ error: 'Nickname must be at least 3 characters' }, { status: 400 })

  // Check nickname not taken by someone else
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('nickname', nickname)
    .neq('id', player.id)
    .maybeSingle()

  if (existing)
    return NextResponse.json({ error: 'Nickname already taken' }, { status: 400 })

  const updates: any = {
    nickname,
    onboarded: true,
  }

  if (avatar_url !== undefined) updates.avatar_url = avatar_url
  if (whatsapp !== undefined) updates.whatsapp = whatsapp?.replace(/\D/g, '') ?? null

  const { error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', player.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
