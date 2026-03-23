import { NextRequest, NextResponse } from 'next/server'

const PLAYER_ROUTES = ['/dashboard', '/register', '/profile', '/setup']
const ADMIN_ROUTES  = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session      = req.cookies.get('lume_session')?.value
  const adminAuth    = req.cookies.get('lume_admin')?.value

  if (pathname === '/admin/login') return NextResponse.next()

  if (PLAYER_ROUTES.some(r => pathname.startsWith(r))) {
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
    const onboarded = req.cookies.get('lume_onboarded')?.value
    if (pathname !== '/setup' && onboarded === '0') {
      return NextResponse.redirect(new URL('/setup', req.url))
    }
  }

  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!adminAuth) return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/register/:path*', '/profile/:path*', '/setup/:path*', '/admin/:path*']
}
