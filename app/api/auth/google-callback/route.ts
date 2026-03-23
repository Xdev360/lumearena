import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url))
  }

  try {
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url))
    }

    const user      = data.user
    const email     = user.email ?? ''
    const fullName  = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? ''

    // Check if player already exists
    let { data: existing } = await supabaseAdmin
      .from('players')
      .select('id, onboarded, nickname')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      // New player — create account with Google data
      const { data: newPlayer, error: createErr } = await supabaseAdmin
        .from('players')
        .insert({
          email,
          full_name:    fullName,
          avatar_url:   avatarUrl,
          onboarded:    false,
          total_points: 0,
          total_wins:   0,
          total_losses: 0,
          total_matches: 0,
          total_prizes: 0,
        })
        .select('id, onboarded, nickname')
        .single()

      if (createErr || !newPlayer) {
        console.error('Create player error:', createErr)
        return NextResponse.redirect(new URL('/login?error=create_failed', req.url))
      }

      existing = newPlayer
    }

    // Create our own session cookie
    const token = await createSession(existing.id)

    // Decide where to redirect
    // If onboarded → dashboard
    // If not onboarded but has nickname → dashboard
    // If not onboarded and no nickname → setup (just need nickname)
    const destination = (existing.onboarded || existing.nickname)
      ? '/dashboard'
      : '/setup'

    const response = NextResponse.redirect(new URL(destination, req.url))

    response.cookies.set('lume_session', token, {
      httpOnly: true,
      secure:   true,
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/'
    })

    return response

  } catch (err: unknown) {
    console.error('Callback exception:', err instanceof Error ? err.message : err)
    return NextResponse.redirect(new URL('/login?error=server_error', req.url))
  }
}
