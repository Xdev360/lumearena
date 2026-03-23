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
  const [googleLoad, setGoogleLoad] = useState(false)
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

  async function handleGoogle() {
    setGoogleLoad(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/google-callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    })
    if (error) {
      setError('Google sign in failed. Try again.')
      setGoogleLoad(false)
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

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoad}
            style={{ width: '100%', minHeight: 48, background: '#fff', color: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, opacity: googleLoad ? .7 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoad ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="divider-label" style={{ marginBottom: 14 }}>
            <span>OR</span>
          </div>

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

