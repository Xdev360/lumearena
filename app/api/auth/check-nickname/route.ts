import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  const n = req.nextUrl.searchParams.get('n')
  if (!n) return NextResponse.json({ taken: false })

  const { data } = await supabase
    .from('players').select('id').eq('nickname', n).maybeSingle()

  return NextResponse.json({ taken: !!data })
}
