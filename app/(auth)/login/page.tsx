'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const slide = {
  hidden: { opacity: 0, x: 16  },
  show:   { opacity: 1, x: 0,   transition: { duration: 0.3 } },
  exit:   { opacity: 0, x: -16, transition: { duration: 0.2 } }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const [tab, setTab]           = useState<'login'|'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [nickOk, setNickOk]     = useState<null|boolean>(null)

  function reset() {
    setEmail(''); setPassword(''); setNickname('')
    setWhatsapp(''); setError(''); setNickOk(null)
  }

  async function checkNick(raw: string) {
    const clean = raw.toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,20)
    setNickname(clean)
    setNickOk(null)
    if (clean.length < 3) return
    const { data } = await supabase
      .from('players').select('id').eq('nickname', clean).maybeSingle()
    setNickOk(!data)
  }

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      if (tab === 'signup') {
        if (!nickname || nickname.length < 3) { setError('Enter a nickname (min 3 characters)'); return }
        if (nickOk === false) { setError('Nickname already taken'); return }
      }
      const url  = tab === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = tab === 'login'
        ? { email, password }
        : { email, password, nickname, whatsapp }

      const res  = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(data.onboarded ? redirect : '/setup')
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const ready = email && password && (tab === 'login' || (nickname.length >= 3 && nickOk !== false))

  return (
    <div style={{ minHeight: '100dvh', background: '#080808', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 500px 300px at 50% -60px,rgba(0,62,49,.4) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      <div style={{ padding: '20px 20px 0', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: '#BEFF00', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
          </div>
          <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 13, letterSpacing: 2 }}>LUME ARENA</span>
        </Link>
      </div>

      <div className="page" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 420 }}>
        <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 className="h1" style={{ marginBottom: 6 }}>
              {tab === 'login' ? 'Welcome back' : 'Join the arena'}
            </h1>
            <p className="body" style={{ marginBottom: 24 }}>
              {tab === 'login' ? 'Sign in to your account' : "Create your account"}
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="tab-bar">
            <button className={`tab-btn ${tab === 'login' ? 'active' : 'inactive'}`} onClick={() => { setTab('login'); reset() }}>Log In</button>
            <button className={`tab-btn ${tab === 'signup' ? 'active' : 'inactive'}`} onClick={() => { setTab('signup'); reset() }}>Sign Up</button>
          </div>

          {/* Form */}
          <div className="card" style={{ padding: 20 }}>
            <AnimatePresence mode="wait">
              <motion.div key={tab} variants={slide} initial="hidden" animate="show" exit="exit">

                {/* Nickname — signup only */}
                {tab === 'signup' && (
                  <div className="input-wrap">
                    <label className="input-label">Nickname <span style={{ color: 'var(--lemon)', letterSpacing: 0, textTransform: 'none' }}>— shown in matches</span></label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: 15, pointerEvents: 'none' }}>@</span>
                      <input type="text" className="input" placeholder="lumekiller99" value={nickname}
                        onChange={e => { checkNick(e.target.value); setError('') }}
                        maxLength={20}
                        style={{ paddingLeft: 30, borderColor: nickOk === false ? 'var(--danger)' : nickOk === true ? 'var(--lemon)' : 'var(--border)' }}
                      />
                    </div>
                    {nickname.length >= 3 && (
                      <p style={{ fontSize: 11, color: nickOk === false ? '#E24B4A' : nickOk === true ? '#BEFF00' : '#555', marginTop: 5 }}>
                        {nickOk === null ? 'Checking…' : nickOk ? '✓ Available' : '✗ Already taken'}
                      </p>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="input-wrap">
                  <label className="input-label">Email</label>
                  <input type="email" className="input" placeholder="you@email.com" value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    onFocus={e => e.target.style.borderColor='var(--lemon)'}
                    onBlur={e  => e.target.style.borderColor='var(--border)'}
                  />
                </div>

                {/* WhatsApp — signup only */}
                {tab === 'signup' && (
                  <div className="input-wrap">
                    <label className="input-label">WhatsApp <span style={{ color: 'var(--dim)', letterSpacing: 0, textTransform: 'none' }}>— optional</span></label>
                    <input type="tel" className="input" placeholder="08012345678" value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      onFocus={e => e.target.style.borderColor='var(--lemon)'}
                      onBlur={e  => e.target.style.borderColor='var(--border)'}
                    />
                  </div>
                )}

                {/* Password */}
                <div className="input-wrap" style={{ marginBottom: 18 }}>
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'}
                      className="input"
                      placeholder={tab === 'signup' ? 'Min. 6 characters' : 'Your password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={{ paddingRight: 60 }}
                      onFocus={e => e.target.style.borderColor='var(--lemon)'}
                      onBlur={e  => e.target.style.borderColor='var(--border)'}
                    />
                    <button onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                      {showPw ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-box">
                    {error}
                  </motion.div>
                )}

                <button onClick={handleSubmit} disabled={loading || !ready}
                  className="btn btn-primary btn-full"
                  style={{ minHeight: 50 }}>
                  {loading ? 'PLEASE WAIT…' : tab === 'login' ? 'LOG IN →' : 'CREATE ACCOUNT →'}
                </button>

              </motion.div>
            </AnimatePresence>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 14 }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); reset() }}
              style={{ background: 'none', border: 'none', color: '#BEFF00', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              {tab === 'login' ? 'Sign up free' : 'Log in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}

