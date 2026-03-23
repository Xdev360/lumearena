'use client'

/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.22 } }
}

type Step = 'loading' | 'locked' | 'select' | 'payment' | 'submitted'
type Game = 'FC26' | 'MK'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep]               = useState<Step>('loading')
  const [week, setWeek]               = useState<any>(null)
  const [game, setGame]               = useState<Game | null>(null)
  const [fullName, setFullName]       = useState('')
  const [batch, setBatch]             = useState<any>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [error, setError]             = useState('')
  const [submitting, setSubmitting]   = useState(false)

  // Payment state
  const [bankDetails, setBankDetails] = useState({ bank_name: 'Loading...', account_number: '...', account_name: '...' })
  const [accountName, setAccountName] = useState('')
  const [regId, setRegId]             = useState('')
  const [reference, setReference]     = useState('')
  const [expiresAt, setExpiresAt]     = useState<Date | null>(null)
  const [timeLeft, setTimeLeft]       = useState(300)
  const [notifying, setNotifying]     = useState(false)
  const [copied, setCopied]           = useState(false)

  // 1. Check if week is open on mount
  useEffect(() => {
    async function checkWeek() {
      const res  = await fetch('/api/register/check-week')
      const data = await res.json()
      setWeek(data.week)
      setStep(data.locked ? 'locked' : 'select')
    }
    checkWeek()
  }, [])

  // Load bank details for payment step
  useEffect(() => {
    supabase.from('bank_settings').select('*').eq('is_active', true).single()
      .then(({ data }) => { if (data) setBankDetails(data) })
  }, [])

  // 2. Load batch preview when game is selected
  useEffect(() => {
    if (!game) return
    setBatchLoading(true)
    setBatch(null)
    fetch(`/api/register/batch-preview?game=${game}`)
      .then(r => r.json())
      .then(d => { setBatch(d.batch); setBatchLoading(false) })
  }, [game])

  // 3. Payment countdown
  useEffect(() => {
    if (step !== 'payment' || !expiresAt) return
    const tick = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setTimeLeft(left)
      if (left <= 0) clearInterval(tick)
    }, 1000)
    return () => clearInterval(tick)
  }, [step, expiresAt])

  const mins    = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs    = String(timeLeft % 60).padStart(2, '0')
  const urgent  = timeLeft <= 60
  const expired = timeLeft <= 0

  async function handleRegister() {
    if (!game)      { setError('Choose a game first'); return }
    if (!fullName.trim()) { setError('Enter your name'); return }
    setSubmitting(true); setError('')

    const res  = await fetch('/api/register/create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ full_name: fullName.trim(), game, week_number: week.week_number })
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      if (data.existing_id) router.push('/dashboard')
      setSubmitting(false)
      return
    }

    setRegId(data.registration_id)
    setReference(data.reference)
    setExpiresAt(new Date(data.expires_at))
    setTimeLeft(300)
    setStep('payment')
    setSubmitting(false)
  }

  async function handlePaid() {
    if (expired) return
    setNotifying(true)
    await fetch('/api/register/notify-paid', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ registration_id: regId, reference })
    })
    setStep('submitted')
    setNotifying(false)
  }

  function copyRef() {
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const slotsLeft = batch ? batch.max_slots - batch.slots_filled : null
  const pct       = batch ? (batch.slots_filled / batch.max_slots) * 100 : 0

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, sans-serif' }}>

      {/* Glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 700px 400px at 50% -80px, rgba(0,62,49,0.35) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      {/* Back nav */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #111', zIndex: 50 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: '#BEFF00', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black', Arial" }}>LA</span>
          </div>
          <span style={{ fontFamily: "'Arial Black', Arial", fontSize: 12, letterSpacing: 2, color: '#fff' }}>LUME ARENA</span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1, marginTop: 56 }}>
        <AnimatePresence mode="wait">

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <motion.div key="loading" variants={fadeUp} initial="hidden" animate="show" exit="exit" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ width: 32, height: 32, border: '2px solid #1A1A1A', borderTopColor: '#BEFF00', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </motion.div>
          )}

          {/* ── WEEK LOCKED ── */}
          {step === 'locked' && (
            <motion.div key="locked" variants={fadeUp} initial="hidden" animate="show" exit="exit">
              <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: '#111', border: '0.5px solid #1A1A1A', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div style={{ fontFamily: "'Arial Black', Arial", fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -0.5 }}>
                  Registrations Locked
                </div>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 28 }}>
                  Week {week?.week_number ?? ''} registrations haven't opened yet. Check back soon or follow us on WhatsApp for updates.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', border: '0.5px solid #1A1A1A', borderRadius: 100, padding: '8px 18px', marginBottom: 24 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }}/>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase' }}>Week Locked</span>
                </div>
                <br/>
                <Link href="/dashboard" style={{ fontSize: 13, color: '#BEFF00', textDecoration: 'none', fontWeight: 700 }}>← Back to dashboard</Link>
              </div>
            </motion.div>
          )}

          {/* ── SELECTION FORM ── */}
          {step === 'select' && (
            <motion.div key="select" variants={fadeUp} initial="hidden" animate="show" exit="exit">

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#003E31', border: '0.5px solid #005544', borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#BEFF00' }}/>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#BEFF00', textTransform: 'uppercase' }}>Week {week?.week_number} — Open</span>
                </div>
                <h1 style={{ fontFamily: "'Arial Black', Arial", fontSize: 28, fontWeight: 900, letterSpacing: -1, color: '#fff' }}>Register to compete</h1>
                <p style={{ fontSize: 13, color: '#444', marginTop: 8 }}>Entry fee: <span style={{ color: '#BEFF00', fontWeight: 700 }}>₦30,000</span></p>
              </div>

              <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 20, padding: '28px 24px' }}>

                {/* Name */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>Your name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError('') }}
                    style={{ width: '100%', background: '#080808', border: `1px solid ${error && !fullName ? '#E24B4A' : '#1A1A1A'}`, borderRadius: 10, padding: '13px 14px', fontSize: 15, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s' }}
                    onFocus={e => e.target.style.borderColor = '#BEFF00'}
                    onBlur={e  => e.target.style.borderColor = error && !fullName ? '#E24B4A' : '#1A1A1A'}
                  />
                </div>

                {/* Game selector */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 10 }}>Choose your game</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {([
                      { id: 'FC26', label: 'EA FC 26',      accent: '#fff',    icon: '⚽' },
                      { id: 'MK',   label: 'Mortal Kombat', accent: '#E24B4A', icon: '🥊' }
                    ] as const).map(g => (
                      <button
                        key={g.id}
                        onClick={() => { setGame(g.id); setError('') }}
                        style={{
                          background:  game === g.id ? (g.id === 'FC26' ? '#003E31' : '#1a0000') : '#080808',
                          border:      `1.5px solid ${game === g.id ? (g.id === 'FC26' ? '#BEFF00' : '#E24B4A') : '#1A1A1A'}`,
                          borderRadius: 12, padding: '18px 12px', cursor: 'pointer', textAlign: 'center', transition: 'all .2s'
                        }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{g.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: game === g.id ? g.accent : '#555', fontFamily: "'Arial Black', Arial", letterSpacing: 0.5 }}>
                          {g.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live batch preview */}
                <AnimatePresence>
                  {game && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginBottom: 20 }}
                    >
                      <div style={{ background: '#080808', border: '0.5px solid #1A1A1A', borderRadius: 12, padding: '14px 16px' }}>
                        {batchLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 16, height: 16, border: '2px solid #1A1A1A', borderTopColor: '#BEFF00', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}/>
                            <span style={{ fontSize: 12, color: '#333' }}>Checking available batches…</span>
                          </div>
                        ) : batch ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div>
                                <span style={{ fontSize: 10, color: '#333', letterSpacing: 3, textTransform: 'uppercase' }}>You'll join</span>
                                <div style={{ fontFamily: "'Arial Black', Arial", fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 2 }}>Batch {batch.label}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: slotsLeft! <= 2 ? '#E24B4A' : '#BEFF00', fontFamily: "'Arial Black', Arial" }}>
                                  {slotsLeft}
                                </div>
                                <div style={{ fontSize: 10, color: '#333', letterSpacing: 2 }}>SPOTS LEFT</div>
                              </div>
                            </div>
                            <div style={{ height: 4, background: '#1A1A1A', borderRadius: 2, marginBottom: 8 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                                style={{ height: 4, background: slotsLeft! <= 2 ? '#E24B4A' : '#BEFF00', borderRadius: 2 }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11, color: '#333' }}>{batch.slots_filled} players registered</span>
                              <span style={{ fontSize: 11, color: '#333' }}>{batch.max_slots} max</span>
                            </div>
                            {slotsLeft! <= 2 && (
                              <div style={{ marginTop: 10, background: '#1a0000', border: '0.5px solid #330000', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#E24B4A', fontWeight: 600 }}>
                                Only {slotsLeft} spot{slotsLeft === 1 ? '' : 's'} left — register now
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize: 13, color: '#555', textAlign: 'center', padding: '8px 0' }}>
                            No open batches for {game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'} right now
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prize reminder */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {[{ l: '1st place', v: '₦80,000', c: '#BEFF00' }, { l: '2nd place', v: '₦50,000', c: '#555' }].map(p => (
                    <div key={p.l} style={{ flex: 1, background: '#080808', border: '0.5px solid #111', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#333', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>{p.l}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: p.c, fontFamily: "'Arial Black', Arial" }}>{p.v}</div>
                    </div>
                  ))}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: '#1a0000', border: '0.5px solid #330000', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E24B4A', marginBottom: 16 }}>
                    {error}
                  </motion.div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={submitting || !game || !fullName.trim()}
                  style={{
                    width: '100%', background: submitting || !game || !fullName.trim() ? '#111' : '#BEFF00',
                    color: submitting || !game || !fullName.trim() ? '#333' : '#080808',
                    border: 'none', borderRadius: 12, padding: '16px 0', fontSize: 15,
                    fontWeight: 900, fontFamily: "'Arial Black', Arial", letterSpacing: 1,
                    cursor: submitting || !game || !fullName.trim() ? 'not-allowed' : 'pointer', transition: 'all .2s'
                  }}
                >
                  {submitting ? 'PROCESSING...' : 'PROCEED TO PAYMENT →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── PAYMENT ── */}
          {step === 'payment' && (
            <motion.div key="payment" variants={fadeUp} initial="hidden" animate="show" exit="exit">

              {/* Timer */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: '#444', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 }}>
                  Complete payment within
                </div>
                <div style={{
                  fontFamily: 'monospace', fontSize: 64, fontWeight: 900,
                  color: expired ? '#E24B4A' : urgent ? '#EF9F27' : '#BEFF00',
                  lineHeight: 1, letterSpacing: 4, transition: 'color .5s'
                }}>
                  {mins}:{secs}
                </div>
                {expired && (
                  <div style={{ fontSize: 13, color: '#E24B4A', marginTop: 8 }}>Time expired — please register again</div>
                )}
              </div>

              <div style={{ background: '#0C0C0C', border: `0.5px solid ${expired ? '#330000' : urgent ? '#332200' : '#1A1A1A'}`, borderRadius: 20, padding: '24px', transition: 'border-color .5s' }}>

                <div style={{ fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
                  Transfer exactly <span style={{ color: '#BEFF00', fontWeight: 700, fontSize: 15 }}>₦30,000</span> to this account
                </div>

                {/* Bank details */}
                <div style={{ background: '#080808', border: '0.5px solid #111', borderRadius: 14, padding: '6px 0', marginBottom: 20 }}>
                  {[
                    { label: 'Bank',           value: bankDetails.bank_name,    highlight: false },
                    { label: 'Account Number', value: bankDetails.account_number, highlight: true  },
                    { label: 'Account Name',   value: bankDetails.account_name, highlight: false },
                    { label: 'Amount',         value: '₦30,000',                highlight: true  },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: i < 3 ? '0.5px solid #111' : 'none' }}>
                      <span style={{ fontSize: 11, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>{row.label}</span>
                      <span style={{ fontSize: row.highlight ? 20 : 14, fontWeight: 700, color: row.highlight ? '#BEFF00' : '#fff', fontFamily: row.highlight ? "'Arial Black', Arial" : 'inherit', letterSpacing: row.label === 'Account Number' ? 3 : 0 }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Account name field */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>
                    Account name on your transfer
                  </label>
                  <input
                    type="text"
                    placeholder="As it appears on your bank app"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    style={{ width: '100%', background: '#080808', border: '1px solid #1A1A1A', borderRadius: 10, padding: '13px 14px', fontSize: 16, color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#BEFF00'}
                    onBlur={e  => e.target.style.borderColor = '#1A1A1A'}
                  />
                  <p style={{ fontSize: 11, color: '#333', marginTop: 5 }}>This helps us match your transfer quickly</p>
                </div>

                {/* Reference */}
                <div style={{ background: '#080808', border: '1px dashed #222', borderRadius: 12, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, letterSpacing: 4, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>
                    Add this as transfer narration
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#BEFF00', letterSpacing: 3, fontFamily: "'Arial Black', Arial", marginBottom: 12 }}>
                    {reference}
                  </div>
                  <button
                    onClick={copyRef}
                    style={{ background: copied ? '#003E31' : '#111', border: `0.5px solid ${copied ? '#BEFF00' : '#222'}`, color: copied ? '#BEFF00' : '#555', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', letterSpacing: 1 }}
                  >
                    {copied ? '✓ COPIED' : 'COPY REFERENCE'}
                  </button>
                </div>

                <div style={{ background: '#0a0800', border: '0.5px solid #221a00', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#443300', lineHeight: 1.6 }}>
                  Include the reference code in your transfer narration so we can match your payment instantly.
                </div>

                <button
                  onClick={handlePaid}
                  disabled={notifying || expired}
                  style={{
                    width: '100%', background: expired ? '#111' : notifying ? '#1a2a1a' : '#BEFF00',
                    color: expired ? '#333' : notifying ? '#BEFF00' : '#080808',
                    border: 'none', borderRadius: 12, padding: '16px 0', fontSize: 15,
                    fontWeight: 900, fontFamily: "'Arial Black', Arial", letterSpacing: 1,
                    cursor: expired || notifying ? 'not-allowed' : 'pointer', transition: 'all .2s', marginBottom: 12
                  }}
                >
                  {notifying ? 'NOTIFYING ADMIN...' : expired ? 'TIME EXPIRED' : 'I HAVE TRANSFERRED — NOTIFY ADMIN'}
                </button>

                {expired && (
                  <button
                    onClick={() => { setStep('select'); setTimeLeft(300) }}
                    style={{ width: '100%', background: 'transparent', border: '0.5px solid #1A1A1A', color: '#444', borderRadius: 12, padding: '13px 0', fontSize: 13, cursor: 'pointer' }}
                  >
                    Start over
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SUBMITTED ── */}
          {step === 'submitted' && (
            <motion.div key="submitted" variants={fadeUp} initial="hidden" animate="show" exit="exit">
              <div style={{ background: '#0C0C0C', border: '0.5px solid #003E31', borderRadius: 20, padding: '48px 28px', textAlign: 'center' }}>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  style={{ width: 72, height: 72, background: '#003E31', border: '0.5px solid #005544', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#BEFF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </motion.div>

                <h2 style={{ fontFamily: "'Arial Black', Arial", fontSize: 24, fontWeight: 900, letterSpacing: -0.5, color: '#fff', marginBottom: 12 }}>
                  Payment submitted
                </h2>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 24 }}>
                  We've notified our team. Once your transfer is confirmed you'll be assigned to a batch and receive your match date.
                </p>

                <div style={{ background: '#080808', border: '0.5px solid #111', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
                  <div style={{ fontSize: 10, color: '#333', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Your reference</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#BEFF00', letterSpacing: 3, fontFamily: "'Arial Black', Arial" }}>{reference}</div>
                </div>

                <div style={{ fontSize: 12, color: '#333', lineHeight: 1.7, marginBottom: 28 }}>
                  Keep this reference safe. Contact <span style={{ color: '#BEFF00' }}>09134071813</span> on WhatsApp if you need help.
                </div>

                <Link href="/dashboard">
                  <button style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 14, fontWeight: 900, fontFamily: "'Arial Black', Arial", letterSpacing: 1, cursor: 'pointer' }}>
                    GO TO DASHBOARD →
                  </button>
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

