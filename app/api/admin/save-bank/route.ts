import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { bank_name, account_number, account_name, id } = await req.json()

  if (!bank_name || !account_number || !account_name)
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  let result

  if (id) {
    // Update existing
    result = await supabase
      .from('bank_settings')
      .update({ bank_name, account_number, account_name, updated_at: new Date().toISOString() })
      .eq('id', id)
  } else {
    // Insert new
    result = await supabase
      .from('bank_settings')
      .insert({ bank_name, account_number, account_name, is_active: true })
  }

  if (result.error)
    return NextResponse.json({ error: result.error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
