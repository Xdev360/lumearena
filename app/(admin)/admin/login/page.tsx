'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AdminLogin() {
  const router = useRouter()
  const [pw, setPw]         = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true); setError('')
    const res  = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: pw })
    })
    if (res.ok) { router.push('/admin') }
    else        { setError('Incorrect password'); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 600px 400px at 50% -100px, rgba(0,62,49,0.4) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: '#BEFF00', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: '#333', fontWeight: 700, textTransform: 'uppercase' }}>Admin Access</div>
        </div>
        <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 18, padding: '28px 24px' }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
          <input
            type="password" placeholder="Enter admin password" value={pw}
            onChange={e => { setPw(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', background: '#080808', border: `1px solid ${error ? '#E24B4A' : '#1A1A1A'}`, borderRadius: 10, padding: '13px 14px', fontSize: 15, color: '#fff', outline: 'none', marginBottom: 12 }}
            autoFocus
          />
          {error && <p style={{ fontSize: 12, color: '#E24B4A', marginBottom: 12 }}>{error}</p>}
          <button onClick={login} disabled={loading}
            style={{ width: '100%', background: loading ? '#111' : '#BEFF00', color: loading ? '#333' : '#080808', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 14, fontWeight: 900, fontFamily: "'Arial Black',Arial", letterSpacing: 1, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'ENTERING...' : 'ENTER →'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

