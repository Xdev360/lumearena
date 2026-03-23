import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    console.error('No code received')
    return NextResponse.redirect(new URL('/login?error=no_code', req.url))
  }

  try {
    // Exchange code for session using anon client
    const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      console.error('Exchange error:', error)
      return NextResponse.redirect(new URL('/login?error=exchange_failed', req.url))
    }

    const user  = data.user
    const email = user.email ?? ''

    // Find or create player in our players table
    let { data: player } = await supabase
      .from('players')
      .select('id, onboarded')
      .eq('email', email)
      .maybeSingle()

    if (!player) {
      const { data: newPlayer, error: insertErr } = await supabase
        .from('players')
        .insert({
          email,
          full_name:  user.user_metadata?.full_name ?? '',
          avatar_url: user.user_metadata?.avatar_url ?? '',
          onboarded:  false
        })
        .select('id, onboarded')
        .single()

      if (insertErr) {
        console.error('Insert error:', insertErr)
        return NextResponse.redirect(new URL('/login?error=player_failed', req.url))
      }

      player = newPlayer
    }

    if (!player) {
      return NextResponse.redirect(new URL('/login?error=no_player', req.url))
    }

    // Create our own session cookie
    const token    = await createSession(player.id)
    const dest     = player.onboarded ? '/dashboard' : '/setup'
    const response = NextResponse.redirect(new URL(dest, req.url))

    response.cookies.set('lume_session', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/'
    })

    response.cookies.set('lume_onboarded', player.onboarded ? '1' : '0', {
      httpOnly: false,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   30 * 24 * 60 * 60,
      path:     '/'
    })

    return response

  } catch (e: any) {
    console.error('Callback error:', e.message)
    return NextResponse.redirect(new URL('/login?error=server_error', req.url))
  }
}
