'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/components/ui/Button'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Badge from '@/components/ui/Badge'
import Footer from '@/components/layout/Footer'
import PublicNav from '@/components/layout/PublicNav'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    return createClient(url, key)
  }
  return null
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } }
}

type Batch = {
  id: string; label: string; game: string
  slots_filled: number; max_slots: number; status: string
}

type Winner = {
  player_name: string; game: string
  position: number; prize_won: number; week_number: number
}

export default function HomePage() {
  const [batches, setBatches]   = useState<Batch[]>([])
  const [winners, setWinners]   = useState<Winner[]>([])
  const [weekOpen, setWeekOpen] = useState(false)

  const howRef  = useRef(null)
  const batchRef = useRef(null)
  const howIn   = useInView(howRef,   { once: true, margin: '-80px' })
  const batchIn = useInView(batchRef, { once: true, margin: '-80px' })

  useEffect(() => {
    const client = getSupabase()
    if (!client) return
    const safeClient = client

    async function load() {
      const [{ data: b }, { data: w }, { data: wk }] = await Promise.all([
        safeClient.from('batches').select('*').eq('status', 'open').order('created_at'),
        safeClient.from('leaderboard').select('*').order('created_at', { ascending: false }).limit(6),
        safeClient.from('weeks').select('status').order('week_number', { ascending: false }).limit(1).single(),
      ])
      if (b) setBatches(b)
      if (w) setWinners(w)
      if (wk) setWeekOpen(wk.status === 'open')
    }
    load()

    const channel = safeClient.channel('home-batches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, load)
      .subscribe()
    return () => { safeClient.removeChannel(channel) }
  }, [])

  const fc26 = batches.filter(b => b.game === 'FC26')
  const mk   = batches.filter(b => b.game === 'MK')

  return (
    <main style={{ background: '#080808', minHeight: '100vh' }}>

      {/* Ticker wrapper */}
      <div style={{ overflow: 'hidden', borderBottom: '0.5px solid #111', borderTop: '0.5px solid #111', background: '#0C0C0C', padding: '10px 0' }}>
        <div className="ticker-track">
          {/* Duplicate content twice for seamless loop */}
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, whiteSpace: 'nowrap' }}>
              {['LUME Arena Weekly Tournament', '1st Place ₦80,000', '2nd Place ₦50,000', 'Entry ₦30,000', 'EA FC 26', 'Mortal Kombat', 'Every Week', 'Lagos Nigeria'].map((item, j) => (
                <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '0 24px', fontSize: 12, fontWeight: 700, color: j % 2 === 0 ? '#fff' : '#BEFF00', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {item}
                  <span style={{ color: '#333', fontSize: 16 }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <PublicNav />

      {/* ── HERO ── */}
      <section style={{ padding: '80px 24px 64px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <motion.div variants={stagger} initial="hidden" animate="show">

          <motion.div variants={fadeUp}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#003E31', border: '0.5px solid #005544', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#BEFF00', animation: 'pulse-lime 2s infinite' }}/>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#BEFF00', textTransform: 'uppercase' }}>
                {weekOpen ? 'Registrations Open' : 'Coming Soon — Week Opens Shortly'}
              </span>
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(42px, 8vw, 88px)', lineHeight: 0.9, letterSpacing: -2, marginBottom: 24, textTransform: 'uppercase' }}>
            WEEKLY<br/>
            <span style={{ color: '#BEFF00' }}>GAMING</span><br/>
            TOURNAMENT
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: 16, color: '#666', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Compete in EA FC 26 or Mortal Kombat. 8 players per batch.
            Every week. Real money prizes.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            <Link href="/login">
              <button style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 10, padding: '15px 32px', fontSize: 14, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
                SIGN IN / SIGN UP →
              </button>
            </Link>
            <Link href="/batches">
              <button style={{ background: 'transparent', color: '#fff', border: '0.5px solid #222', borderRadius: 10, padding: '15px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                View Batches
              </button>
            </Link>
          </motion.div>

          {/* Prize pills */}
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '1st Place', value: '₦80,000', color: '#BEFF00' },
              { label: '2nd Place', value: '₦50,000', color: '#fff' },
              { label: 'Entry Fee', value: '₦30,000', color: '#666' },
              { label: 'Batch Size', value: '8 Players', color: '#666' },
            ].map(p => (
              <div key={p.label} style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 8, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#444', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: p.color, fontFamily: 'var(--font-display)', letterSpacing: -0.5 }}>{p.value}</div>
              </div>
            ))}
          </motion.div>

        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={howRef} style={{ padding: '64px 24px', borderTop: '0.5px solid #111', background: '#0A0A0A' }}>
        <motion.div variants={stagger} initial="hidden" animate={howIn ? 'show' : 'hidden'} style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, letterSpacing: -1 }}>Three steps to compete</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { n: '01', title: 'Create account', body: 'Sign up with your phone number. Verify via WhatsApp OTP. Takes 30 seconds.' },
              { n: '02', title: 'Register & pay', body: 'Choose your game — EA FC 26 or Mortal Kombat. Transfer ₦30,000. Get assigned to a batch.' },
              { n: '03', title: 'Play & win', body: 'Show up on match day. Beat your bracket. 1st wins ₦80K, 2nd wins ₦50K. Every week.' },
            ].map(s => (
              <motion.div key={s.n} variants={fadeUp} style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 16 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.65 }}>{s.body}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── LIVE BATCHES ── */}
      <section ref={batchRef} style={{ padding: '64px 24px', borderTop: '0.5px solid #111' }}>
        <motion.div variants={stagger} initial="hidden" animate={batchIn ? 'show' : 'hidden'} style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 5, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Live now</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>Open Batches</h2>
            </div>
            <Link href="/batches" style={{ fontSize: 13, color: '#BEFF00', textDecoration: 'none', border: '0.5px solid #BEFF00', borderRadius: 8, padding: '8px 16px' }}>
              View all →
            </Link>
          </motion.div>

          {['FC26', 'MK'].map(game => (
            <motion.div key={game} variants={fadeUp} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: game === 'FC26' ? '#fff' : '#E24B4A', textTransform: 'uppercase', marginBottom: 12 }}>
                {game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(game === 'FC26' ? fc26 : mk).length === 0 ? (
                  <div style={{ color: '#333', fontSize: 13, padding: '12px 0' }}>No open batches — check back soon</div>
                ) : (
                  (game === 'FC26' ? fc26 : mk).map(b => (
                    <div key={b.id} style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 10, padding: '12px 16px', minWidth: 120 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                        Batch {b.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#BEFF00', fontWeight: 700, marginBottom: 6 }}>
                        {b.slots_filled}/{b.max_slots} filled
                      </div>
                      <div style={{ height: 3, background: '#1A1A1A', borderRadius: 2 }}>
                        <div style={{ height: 3, background: '#BEFF00', borderRadius: 2, width: `${(b.slots_filled / b.max_slots) * 100}%`, transition: 'width .5s ease' }}/>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── RECENT WINNERS ── */}
      {winners.length > 0 && (
        <section style={{ padding: '64px 24px', borderTop: '0.5px solid #111', background: '#0A0A0A' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Hall of fame</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>Recent Winners</h2>
              <Link href="/leaderboard" style={{ fontSize: 13, color: '#BEFF00', textDecoration: 'none' }}>Full leaderboard →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {winners.map((w, i) => (
                <div key={i} style={{ background: '#0C0C0C', border: `0.5px solid ${w.position === 1 ? '#003E31' : '#1A1A1A'}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, color: '#444', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
                    {w.game} · Week {w.week_number}
                  </div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 4 }}>{w.player_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: w.position === 1 ? '#BEFF00' : '#666', fontWeight: 700 }}>
                      {w.position === 1 ? '1st Place' : '2nd Place'}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-display)', color: w.position === 1 ? '#BEFF00' : '#555' }}>
                      ₦{w.prize_won.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  )
}
