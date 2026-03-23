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

  const formData = await req.formData()
  const file     = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })

  const ext  = file.name.split('.').pop()
  const path = `${player.id}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('avatars').upload(path, buffer, {
      contentType: file.type, upsert: true
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('avatars').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
