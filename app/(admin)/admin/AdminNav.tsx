'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/admin',          label: 'Overview',  icon: '◈' },
  { href: '/admin/payments', label: 'Payments',  icon: '₦' },
  { href: '/admin/points',   label: 'Points',    icon: '★' },
  { href: '/admin/batches',  label: 'Batches',   icon: '⊞' },
  { href: '/admin/weeks',    label: 'Weeks',     icon: '◷' },
  { href: '/admin/results',  label: 'Results',   icon: '🏆' },
  { href: '/admin/players',  label: 'Users',     icon: '👥' },
  { href: '/admin/settings', label: 'Settings',  icon: '⚙' },
]

export default function AdminNav() {
  const path   = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    document.cookie = 'lume_admin=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    router.push('/admin/login')
  }

  return (
    <aside style={{ width: 200, background: '#0C0C0C', borderRight: '0.5px solid #111', padding: '20px 0', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '0 16px 20px', borderBottom: '0.5px solid #111', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: '#BEFF00', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Arial Black',Arial", letterSpacing: 1, color: '#fff' }}>LUME ARENA</div>
            <div style={{ fontSize: 9, color: '#333', letterSpacing: 2 }}>ADMIN</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {links.map(l => {
          const active = path === l.href || (l.href !== '/admin' && path.startsWith(l.href))
          return (
            <Link key={l.href} href={l.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: active ? '#003E31' : 'transparent', transition: 'all .15s' }}>
                <span style={{ fontSize: 14, color: active ? '#BEFF00' : '#333' }}>{l.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#BEFF00' : '#555' }}>{l.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0 8px' }}>
        <button onClick={logout} style={{ width: '100%', background: 'none', border: '0.5px solid #1A1A1A', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#333', cursor: 'pointer', textAlign: 'left' }}>
          Logout
        </button>
      </div>
    </aside>
  )
}

