import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { batch_id } = await req.json()

  if (!batch_id)
    return NextResponse.json({ error: 'No batch_id provided' }, { status: 400 })

  const { data: regs } = await supabase
    .from('registrations')
    .select('player_id, id')
    .eq('batch_id', batch_id)

  const { data: batch } = await supabase
    .from('batches')
    .select('label')
    .eq('id', batch_id)
    .single()

  if (regs?.length && batch) {
    await supabase.from('notifications').insert(
      regs.map((r: { player_id: string }) => ({
        player_id: r.player_id,
        title:     `Batch ${batch.label} removed`,
        body:      'Your batch has been cancelled by admin. Please contact us for more info.',
        type:      'admin_action'
      }))
    )
  }

  if (regs?.length) {
    await supabase
      .from('registrations')
      .update({ batch_id: null, slot_number: null })
      .eq('batch_id', batch_id)
  }

  // Clear leaderboard references
  await supabase
    .from('leaderboard')
    .update({ batch_id: null })
    .eq('batch_id', batch_id)

  // Clear points_log references
  await supabase
    .from('points_log')
    .update({ batch_id: null })
    .eq('batch_id', batch_id)

  // NOW delete the batch
  const { error } = await supabase
    .from('batches')
    .delete()
    .eq('id', batch_id)

  if (error) {
    console.error('Delete batch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
