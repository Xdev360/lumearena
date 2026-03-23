import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { assignPlayerToBatch } from '@/lib/batch-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { payment_id, registration_id, player_id, decision } = await req.json()

  // Update payment
  await supabase.from('payments')
    .update({ status: decision, reviewed_at: new Date().toISOString() })
    .eq('id', payment_id)

  if (decision === 'confirmed') {
    // Update registration
    await supabase.from('registrations')
      .update({ payment_status: 'confirmed' })
      .eq('id', registration_id)

    // Get registration details
    const { data: reg } = await supabase
      .from('registrations')
      .select('game, week_number')
      .eq('id', registration_id)
      .single()

    if (reg) {
      await assignPlayerToBatch(reg.game, reg.week_number, registration_id, player_id)
    }
  } else {
    // Failed — notify player
    await supabase.from('registrations')
      .update({ payment_status: 'failed' })
      .eq('id', registration_id)

    await supabase.from('notifications').insert({
      player_id,
      title: 'Payment not confirmed',
      body:  'We could not verify your transfer. Please register again and ensure you include your reference code.',
      type:  'payment_failed'
    })
  }

  return NextResponse.json({ success: true })
}

