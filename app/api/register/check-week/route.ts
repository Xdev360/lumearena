import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET() {
  const { data: week } = await supabase
    .from('weeks')
    .select('*')
    .order('week_number', { ascending: false })
    .limit(1)
    .single()

  if (!week) return NextResponse.json({ locked: true, week: null })
  return NextResponse.json({ locked: week.status !== 'open', week })
}

