'use client'

import { useState } from 'react'
import Link from 'next/link'

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/lumearena.ng?igsh=MThoYmt4OXFqZDM2Mw%3D%3D&utm_source=qr',
    color: '#E1306C',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    )
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/channel/UC_YfLE-v_6l7iSRZYBdSxDQ',
    color: '#FF0000',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z"/>
      </svg>
    )
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/share/1QPCLeQmcX/?mibextid=wwXIfr',
    color: '#1877F2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
      </svg>
    )
  },
  {
    name: 'WhatsApp',
    href: 'https://chat.whatsapp.com/FLbHzck6TYb1hP9D5F9XTA?mode=gi_t',
    color: '#25D366',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@lume.arena?_r=1&_t=ZS-952MDggpQZe',
    color: '#fff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.84 1.57V6.82a4.85 4.85 0 01-1.07-.13z"/>
      </svg>
    )
  },
]

export default function Footer() {
  const [email, setEmail]     = useState('')
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  async function subscribe() {
    if (!email.includes('@')) { setErr('Enter a valid email'); return }
    setLoading(true); setErr('')
    const res  = await fetch('/api/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (res.ok) setDone(true)
    else        setErr(data.error ?? 'Try again')
    setLoading(false)
  }

  return (
    <footer style={{ background: '#080808', borderTop: '0.5px solid #111', fontFamily: 'system-ui,sans-serif' }}>

      {/* Newsletter strip */}
      <div style={{ background: '#003E31', padding: 'clamp(28px,5vw,48px) clamp(16px,5vw,40px)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          {done ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
              <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 20, fontWeight: 900, color: '#BEFF00', marginBottom: 6 }}>You&apos;re in</div>
              <p style={{ fontSize: 13, color: '#BEFF00', opacity: .6 }}>We&apos;ll notify you when new tournaments open.</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: '#BEFF00', opacity: .6, textTransform: 'uppercase', marginBottom: 8 }}>
                Stay updated
              </div>
              <h3 style={{ fontFamily: "'Arial Black',Arial", fontSize: 'clamp(18px,4vw,26px)', fontWeight: 900, letterSpacing: -0.5, color: '#fff', marginBottom: 6 }}>
                Never miss a tournament
              </h3>
              <p style={{ fontSize: 13, color: '#BEFF00', opacity: .5, marginBottom: 20, lineHeight: 1.6 }}>
                Get notified when new weeks open and prizes are announced.
              </p>
              <div style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && subscribe()}
                  style={{ flex: 1, minWidth: 180, background: '#080808', border: '1px solid rgba(190,255,0,.25)', borderRadius: 10, padding: '13px 14px', fontSize: 15, color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(190,255,0,.7)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(190,255,0,.25)'}
                />
                <button
                  onClick={subscribe}
                  disabled={loading}
                  style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 13, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1, whiteSpace: 'nowrap', opacity: loading ? .7 : 1 }}>
                  {loading ? '…' : 'SUBSCRIBE'}
                </button>
              </div>
              {err && <p style={{ fontSize: 12, color: '#E24B4A', marginTop: 8 }}>{err}</p>}
            </>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div style={{ padding: 'clamp(28px,4vw,44px) clamp(16px,5vw,40px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, background: '#BEFF00', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
              </div>
              <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 13, letterSpacing: 2, color: '#fff' }}>LUME ARENA</span>
            </div>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.7, marginBottom: 12 }}>
              Weekly gaming tournaments. EA FC 26 & Mortal Kombat. Real prizes every week in Lagos.
            </p>
            <div style={{ fontSize: 12, color: '#333' }}>
              WhatsApp: <span style={{ color: '#BEFF00' }}>09134071813</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 14 }}>
              Navigate
            </div>
            {[
              { href: '/',            label: 'Home'        },
              { href: '/batches',     label: 'Live Batches' },
              { href: '/leaderboard', label: 'Leaderboard'  },
              { href: '/register',    label: 'Register'     },
              { href: '/dashboard',   label: 'My Account'   },
            ].map(l => (
              <Link key={l.href} href={l.href}
                style={{ display: 'block', fontSize: 13, color: '#444', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#BEFF00')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Socials */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 14 }}>
              Follow us
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SOCIALS.map(s => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#444', transition: 'color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = s.color }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#444' }}>
                  <div style={{ width: 36, height: 36, background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color .15s' }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '0.5px solid #111', padding: '14px clamp(16px,5vw,40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#222' }}>© 2025 LUME Arena. All rights reserved.</span>
          <Link
            href="/admin/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '0.5px solid #1A1A1A',
              textDecoration: 'none',
              opacity: .25,
              transition: 'opacity .2s'
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '.25'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BEFF00" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </Link>
        </div>
        <span style={{ fontSize: 11, color: '#222' }}>Lagos, Nigeria</span>
      </div>

    </footer>
  )
}
