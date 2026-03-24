import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { registration_id, player_id, batch_id } = await req.json()

  if (!registration_id || !player_id || !batch_id) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  // Get batch info for notification
  const { data: batch } = await supabase
    .from('batches')
    .select('label, slots_filled')
    .eq('id', batch_id)
    .single()

  // Remove player from batch
  const { error: updateErr } = await supabase
    .from('registrations')
    .update({
      batch_id: null,
      slot_number: null,
      payment_status: 'pending',
    })
    .eq('id', registration_id)

  if (updateErr) {
    console.error('remove-from-batch registration update:', updateErr)
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  // Decrease slot count
  if (batch && batch.slots_filled > 0) {
    const { error: batchErr } = await supabase
      .from('batches')
      .update({
        slots_filled: batch.slots_filled - 1,
        status: 'open',
      })
      .eq('id', batch_id)

    if (batchErr) {
      console.error('remove-from-batch batch update:', batchErr)
      return NextResponse.json({ success: false, error: batchErr.message }, { status: 500 })
    }
  }

  // Notify player
  const { error: notifErr } = await supabase.from('notifications').insert({
    player_id,
    title: `Removed from Batch ${batch?.label ?? ''}`,
    body: 'You have been removed from your batch by admin. Please contact us on WhatsApp for more info.',
    type: 'admin_action',
    read: false,
  })

  if (notifErr) {
    console.error('remove-from-batch notification:', notifErr)
    return NextResponse.json({ success: false, error: notifErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
