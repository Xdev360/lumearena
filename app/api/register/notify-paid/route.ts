import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { registration_id, reference } = await req.json()

  // Mark payment as pending review (player says they paid)
  await supabase.from('payments')
    .update({ status: 'pending_review' })
    .eq('reference', reference)

  await supabase.from('registrations')
    .update({ payment_status: 'pending' })
    .eq('id', registration_id)

  return NextResponse.json({ success: true })
}

