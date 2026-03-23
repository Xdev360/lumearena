'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

type Batch = {
  id: string; label: string; game: string
  slots_filled: number; max_slots: number
  status: 'open' | 'full' | 'completed'
  match_date: string | null; match_venue: string | null
  week_number: number
}

type Week = { week_number: number; status: string }

export default function BatchTrackerPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [week, setWeek] = useState<Week | null>(null)
  const [loading, setLoading] = useState(true)
  const [gameFilter, setGameFilter] = useState<'all' | 'FC26' | 'MK'>('all')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    load()

    const ch = supabase.channel('public-batches')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'batches'
      }, () => { load(); setLastUpdated(new Date()) })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  async function load() {
    const [{ data: b }, { data: w }] = await Promise.all([
      supabase.from('batches').select('*').order('game').order('label'),
      supabase.from('weeks').select('week_number, status')
        .order('week_number', { ascending: false }).limit(1).single()
    ])
    if (b) setBatches(b)
    if (w) setWeek(w)
    setLoading(false)
  }

  const totalOpen = batches.filter(b => b.status === 'open').length
  const totalFull = batches.filter(b => b.status === 'full').length
  const totalPlayers = batches.reduce((s, b) => s + b.slots_filled, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 700px 300px at 50% -60px, rgba(0,62,49,0.35) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,8,.92)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #111', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#BEFF00', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
          </div>
          <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 12, letterSpacing: 2, color: '#fff' }}>LUME ARENA</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/leaderboard" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Leaderboard</Link>
          <Link href="/dashboard">
            <button style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
              MY ACCOUNT
            </button>
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px', position: 'relative', zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Live tracking</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, letterSpacing: -1.5, lineHeight: .95 }}>
                Batch<br />Tracker
              </h1>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#BEFF00', animation: 'pulse-dot 2s infinite' }} />
                  <span style={{ fontSize: 11, color: '#BEFF00', fontWeight: 700, letterSpacing: 2 }}>LIVE</span>
                </div>
                <div style={{ fontSize: 10, color: '#333' }}>
                  Updated {format(lastUpdated, 'h:mm:ss a')}
                </div>
              </div>
            </div>
            <style>{`
              @keyframes pulse-dot {
                0%,100%{opacity:1;transform:scale(1)}
                50%{opacity:.5;transform:scale(1.4)}
              }
            `}</style>
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Week', value: week ? `Week ${week.week_number}` : '—', accent: week?.status === 'open' ? '#BEFF00' : '#444' },
              { label: 'Open batches', value: totalOpen, accent: totalOpen > 0 ? '#BEFF00' : '#333' },
              { label: 'Full batches', value: totalFull, accent: totalFull > 0 ? '#EF9F27' : '#333' },
              { label: 'Players in', value: totalPlayers, accent: '#fff' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>{s.label}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: s.accent, fontFamily: "'Arial Black',Arial" }}>{s.value}</span>
              </div>
            ))}

            {week?.status === 'open' && (
              <Link href="/register" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
                  REGISTER NOW →
                </motion.button>
              </Link>
            )}
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {([
              { id: 'all', label: 'All Games' },
              { id: 'FC26', label: 'EA FC 26' },
              { id: 'MK', label: 'Mortal Kombat' },
            ] as const).map(f => (
              <button key={f.id} onClick={() => setGameFilter(f.id)}
                style={{ padding: '7px 16px', borderRadius: 7, border: '0.5px solid #1A1A1A', background: gameFilter === f.id ? '#BEFF00' : '#0C0C0C', color: gameFilter === f.id ? '#080808' : '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', transition: 'all .15s', fontFamily: "'Arial Black',Arial" }}>
                {f.label}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <BatchSkeleton />
          ) : (
            ['FC26', 'MK'].filter(g => gameFilter === 'all' || gameFilter === g).map(game => {
              const gameBatches = batches.filter(b => b.game === game)
              return (
                <motion.div key={game} variants={fadeUp} style={{ marginBottom: 36 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: game === 'FC26' ? '#fff' : '#E24B4A', textTransform: 'uppercase' }}>
                      {game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}
                    </div>
                    <div style={{ flex: 1, height: '0.5px', background: '#111' }} />
                    <div style={{ fontSize: 11, color: '#333' }}>
                      {gameBatches.filter(b => b.status === 'open').length} open · {gameBatches.filter(b => b.status === 'full').length} full
                    </div>
                  </div>

                  {gameBatches.length === 0 ? (
                    <div style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#333', fontSize: 13 }}>
                      No batches open yet — check back when week opens
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                      {gameBatches.map((batch, i) => (
                        <BatchCard key={batch.id} batch={batch} index={i} gameColor={game === 'FC26' ? '#BEFF00' : '#E24B4A'} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })
          )}

          <motion.div variants={fadeUp} style={{ background: '#0C0C0C', border: '0.5px solid #003E31', borderRadius: 16, padding: '28px 24px', textAlign: 'center', marginTop: 12 }}>
            <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 20, fontWeight: 900, marginBottom: 8, letterSpacing: -0.5 }}>
              Ready to compete?
            </div>
            <p style={{ fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 1.6 }}>
              Entry is ₦30,000. Win ₦80,000 for 1st or ₦50,000 for 2nd. 8 players per batch.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={week?.status === 'open' ? '/register' : '/dashboard'}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }}
                  style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 10, padding: '13px 28px', fontSize: 14, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
                  {week?.status === 'open' ? 'REGISTER NOW →' : 'CREATE ACCOUNT →'}
                </motion.button>
              </Link>
              <Link href="/leaderboard">
                <button style={{ background: 'transparent', color: '#fff', border: '0.5px solid #222', borderRadius: 10, padding: '13px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  View leaderboard
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

function BatchCard({ batch, index, gameColor }: { batch: Batch; index: number; gameColor: string }) {
  const pct = (batch.slots_filled / batch.max_slots) * 100
  const slotsLeft = batch.max_slots - batch.slots_filled
  const isFull = batch.status === 'full' || batch.status === 'completed'
  const isCompleted = batch.status === 'completed'

  const borderColor = isCompleted ? '#111' : isFull ? '#003E31' : slotsLeft <= 2 ? '#331100' : '#111'
  const fillColor = isCompleted ? '#333' : isFull ? '#BEFF00' : gameColor

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      style={{ background: '#0C0C0C', border: `0.5px solid ${borderColor}`, borderRadius: 14, padding: '16px', overflow: 'hidden', position: 'relative', transition: 'border-color .3s' }}
    >
      {!isFull && !isCompleted && (
        <div style={{ position: 'absolute', top: 12, right: 12, width: 7, height: 7, borderRadius: '50%', background: slotsLeft <= 2 ? '#E24B4A' : '#BEFF00', animation: 'pulse-dot 2s infinite' }} />
      )}

      <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: -0.5 }}>
        Batch {batch.label}
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <div style={{
          background: isCompleted ? '#111' : isFull ? '#003E31' : '#080808',
          border: `0.5px solid ${isCompleted ? '#1A1A1A' : isFull ? '#005544' : '#1A1A1A'}`,
          borderRadius: 5, padding: '3px 8px', fontSize: 9, fontWeight: 700,
          color: isCompleted ? '#333' : isFull ? '#BEFF00' : '#555',
          letterSpacing: 2, textTransform: 'uppercase' as const
        }}>
          {isCompleted ? 'completed' : isFull ? 'full' : 'open'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: isFull ? '#BEFF00' : '#fff', fontFamily: "'Arial Black',Arial", lineHeight: 1 }}>
            {batch.slots_filled}
            <span style={{ fontSize: 14, color: '#333', fontWeight: 400 }}>/{batch.max_slots}</span>
          </div>
          <div style={{ fontSize: 10, color: '#333', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>players</div>
        </div>
        {!isFull && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: slotsLeft <= 2 ? '#E24B4A' : '#BEFF00', fontFamily: "'Arial Black',Arial", lineHeight: 1 }}>
              {slotsLeft}
            </div>
            <div style={{ fontSize: 10, color: '#333', letterSpacing: 1, textTransform: 'uppercase' }}>left</div>
          </div>
        )}
      </div>

      <div style={{ height: 4, background: '#1A1A1A', borderRadius: 2, marginBottom: 12 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const, delay: index * 0.05 }}
          style={{ height: 4, background: fillColor, borderRadius: 2 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {Array.from({ length: batch.max_slots }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 1,
            background: i < batch.slots_filled ? fillColor : '#1A1A1A',
            transition: 'background .3s',
            opacity: i < batch.slots_filled ? 1 : 0.4
          }} />
        ))}
      </div>

      {batch.match_date && (
        <div style={{ background: '#080808', border: '0.5px solid #003E31', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Match date</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {format(new Date(batch.match_date), 'EEE, MMM d · h:mm a')}
          </div>
          {batch.match_venue && (
            <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{batch.match_venue}</div>
          )}
        </div>
      )}

      {!isFull && slotsLeft <= 2 && (
        <div style={{ background: '#1a0500', border: '0.5px solid #331000', borderRadius: 6, padding: '6px 10px', marginTop: 8, fontSize: 11, color: '#E24B4A', fontWeight: 600 }}>
          Only {slotsLeft} spot{slotsLeft === 1 ? '' : 's'} left!
        </div>
      )}
    </motion.div>
  )
}

function BatchSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: '#0C0C0C', borderRadius: 14, padding: 16, height: 180 }}>
          <div style={{ height: 28, background: '#111', borderRadius: 6, marginBottom: 12, width: '60%', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)' }} />
          <div style={{ height: 12, background: '#111', borderRadius: 4, marginBottom: 8, width: '40%' }} />
          <div style={{ height: 4, background: '#111', borderRadius: 2, marginBottom: 16 }} />
          <div style={{ height: 6, background: '#111', borderRadius: 1 }} />
        </div>
      ))}
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  )
}
