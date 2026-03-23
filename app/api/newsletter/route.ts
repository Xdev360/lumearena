import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email?.includes('@'))
    return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 })

  const { error } = await supabase.from('newsletter')
    .insert({ email: email.toLowerCase().trim() })

  if (error?.code === '23505')
    return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
