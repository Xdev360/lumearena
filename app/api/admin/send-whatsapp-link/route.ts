import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use SERVICE KEY — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { batch_id, link } = await req.json()

  if (!batch_id || !link) {
    return NextResponse.json({ error: 'Missing batch_id or link' }, { status: 400 })
  }

  // 1. Save link to batch
  const { error: batchErr } = await supabase
    .from('batches')
    .update({ whatsapp_link: link })
    .eq('id', batch_id)

  if (batchErr) {
    return NextResponse.json({ error: batchErr.message }, { status: 500 })
  }

  // 2. Get batch info
  const { data: batch } = await supabase
    .from('batches')
    .select('label, game')
    .eq('id', batch_id)
    .single()

  // 3. Get all confirmed players in this batch
  const { data: regs } = await supabase
    .from('registrations')
    .select('player_id')
    .eq('batch_id', batch_id)
    .eq('payment_status', 'confirmed')

  console.log(`Sending WhatsApp link to ${regs?.length ?? 0} players in Batch ${batch?.label}`)

  // 4. Send notification to each player
  if (regs && regs.length > 0) {
    const notifications = regs.map((r: { player_id: string }) => ({
      player_id: r.player_id,
      title:     `Join Batch ${batch?.label} WhatsApp Group`,
      body:      link, // store the actual link as body
      type:      'whatsapp_link',
      read:      false
    }))

    const { error: notifErr } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notifErr) {
      console.error('Notification error:', notifErr)
      return NextResponse.json({ error: 'Saved but notifications failed: ' + notifErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    players_notified: regs?.length ?? 0,
    batch_label: batch?.label
  })
}
