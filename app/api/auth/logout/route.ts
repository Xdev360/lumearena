import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('lume_session')?.value

  if (token) {
    // Best-effort: remove server-side session record.
    try {
      await deleteSession(token)
    } catch {
      // Ignore errors; client-side cookie clear is enough to log out.
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('lume_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  response.cookies.set('lume_onboarded', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  response.cookies.set('lume_admin', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}

