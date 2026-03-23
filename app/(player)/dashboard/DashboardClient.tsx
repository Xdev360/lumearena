'use client'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } }
}

type Props = { data: any; playerId: string }

export default function DashboardClient({ data, playerId }: Props) {
  const router = useRouter()
  const [activeReg, setActiveReg]           = useState(data.activeReg)
  const [notifications, setNotifications]   = useState(data.notifications ?? [])
  const [rank, setRank]                     = useState<number | null>(null)
  const [showNotifs, setShowNotifs]         = useState(false)
  const [week, setWeek]                     = useState(data.week)
  const [tab, setTab]                       = useState<'overview' | 'history'>('overview')

  const unread = notifications.filter((n: any) => !n.read).length

  useEffect(() => {
    // Realtime — listen for batch updates (match date set)
    const batchChannel = supabase.channel(`dashboard-${playerId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'batches'
      }, async () => {
        router.refresh()
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `player_id=eq.${playerId}`
      }, (payload) => {
        setNotifications((prev: any[]) => [payload.new, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'payments'
      }, async () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(batchChannel) }
  }, [playerId])

  useEffect(() => {
    if (data.player?.total_points !== undefined) {
      supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', data.player.total_points ?? 0)
        .then(({ count }) => setRank((count ?? 0) + 1))
    }
  }, [data.player?.total_points])

  async function markAllRead() {
    const unreadIds = notifications
      .filter((n: any) => !n.read)
      .map((n: any) => n.id)

    if (!unreadIds.length) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)

    setNotifications((prev: any[]) => prev.map(n => ({ ...n, read: true })))
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const paymentStatus = activeReg?.payment?.[0]?.status ?? activeReg?.payment_status ?? null
  const batch         = activeReg?.batch ?? null
  const hasMatchDate  = batch?.match_date

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 300, background: 'radial-gradient(ellipse 800px 300px at 50% -50px, rgba(0,62,49,0.35) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #111', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#BEFF00', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black', Arial" }}>LA</span>
          </div>
          <span style={{ fontFamily: "'Arial Black', Arial", fontSize: 12, letterSpacing: 2, color: '#fff' }}>LUME ARENA</span>
        </Link>
      </nav>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px', position: 'relative', zIndex: 1 }}>

        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* ── HEADER ── */}
          <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => router.push('/profile')}>
                  <PlayerAvatar player={data.player} size={48}/>
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, background: '#BEFF00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #080808' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#003E31" strokeWidth="3" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3, opacity: .7 }}>
                    Player
                  </div>
                  <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 20, fontWeight: 900, letterSpacing: -0.5, color: '#fff', lineHeight: 1 }}>
                    Hi, {data.player?.nickname ?? 'Player'}
                  </div>
                  <button onClick={() => router.push('/profile')}
                    style={{ background: 'none', border: 'none', color: '#BEFF00', fontSize: 11, cursor: 'pointer', padding: 0, marginTop: 4, opacity: .6, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                    Edit profile
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unread > 0) markAllRead() }}
                    style={{ background: 'none', border: '0.5px solid #1A1A1A', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: unread > 0 ? '#BEFF00' : '#444' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unread > 0 && (
                      <span style={{ background: '#BEFF00', color: '#080808', fontSize: 9, fontWeight: 900, borderRadius: 10, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>
                        {unread}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifs && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: .97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: .97 }}
                        transition={{ duration: 0.2 }}
                        style={{ position: 'absolute', right: 0, top: 44, width: 290, background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.7)', zIndex: 100 }}>
                        <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Notifications</span>
                        </div>
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                          {notifications.length === 0 ? (
                            <div style={{ padding: '20px 14px', textAlign: 'center', color: '#333', fontSize: 12 }}>
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((n: any) => (
                              <div key={n.id} style={{ padding: '11px 14px', borderBottom: '0.5px solid #0a0a0a', background: n.read ? 'transparent' : '#0a1a0a' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: n.read ? '#555' : '#fff', marginBottom: 3 }}>{n.title}</div>
                                <div style={{ fontSize: 11, color: '#444', lineHeight: 1.5 }}>{n.body}</div>
                                {n.type === 'whatsapp_link' && n.body?.includes('http') && (
                                  <a href={n.body.split('http')[1] ? 'http' + n.body.split('http')[1] : '#'}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-block', marginTop: 7, background: '#003E31', border: '0.5px solid #BEFF00', color: '#BEFF00', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                                    Join WhatsApp Group →
                                  </a>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={logout}
                  style={{ background: 'none', border: '0.5px solid #1A1A1A', borderRadius: 8, padding: '7px 12px', fontSize: 11, color: '#444', cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            </div>
          </motion.div>

          {/* Winner announcement */}
          {data.notifications?.find((n: any) => n.type === 'result' && !n.read && n.title?.includes('won')) && (
            <motion.div
              initial={{ opacity: 0, scale: .97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{ background: 'linear-gradient(135deg,#003E31,#001a14)', border: '1px solid #BEFF00', borderRadius: 14, padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
              <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, color: '#BEFF00', letterSpacing: -0.5, marginBottom: 4 }}>
                You won!
              </div>
              <div style={{ fontSize: 13, color: '#BEFF00', opacity: .7 }}>
                {data.notifications.find((n: any) => n.type === 'result' && n.title?.includes('won'))?.body}
              </div>
            </motion.div>
          )}

          {/* ATM Points Card */}
          {data.player && (
            <motion.div variants={fadeUp}>
              <div className="atm-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 8, opacity: .6 }}>Points balance</div>
                    <div className="atm-pts">{data.player.total_points ?? 0}</div>
                    {rank !== null && (
                      <div style={{ fontSize: 11, color: 'var(--lemon)', opacity: .55, marginTop: 5 }}>#{rank} on the leaderboard</div>
                    )}
                  </div>
                  <div style={{ width: 34, height: 34, background: 'var(--lemon)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--green)', fontFamily: "'Arial Black',Arial" }}>LA</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, borderTop: '0.5px solid rgba(190,255,0,.15)', paddingTop: 14 }}>
                  {[
                    { l: 'Wins',    v: data.player.total_wins    ?? 0, c: 'var(--lemon)' },
                    { l: 'Losses',  v: data.player.total_losses  ?? 0, c: '#fff'         },
                    { l: 'Matches', v: data.player.total_matches ?? 0, c: '#fff'         },
                  ].map(s => (
                    <div className="atm-stat" key={s.l}>
                      <div className="atm-stat-val" style={{ color: s.c }}>{s.v}</div>
                      <div className="atm-stat-lbl">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ACTIVE REGISTRATION CARD ── */}
          <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
            {!activeReg ? (

              /* No registration — show CTA */
              <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, background: '#003E31', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BEFF00" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No active registration</div>
                <div style={{ fontSize: 13, color: '#444', marginBottom: 20, lineHeight: 1.6 }}>
                  {week?.status === 'open'
                    ? 'Week registrations are open. Join a batch now.'
                    : 'Registrations are currently locked. Check back soon.'}
                </div>
                {week?.status === 'open' ? (
                  <Link href="/register">
                    <button style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 13, fontWeight: 900, fontFamily: "'Arial Black', Arial", letterSpacing: 1, cursor: 'pointer' }}>
                      REGISTER NOW →
                    </button>
                  </Link>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', border: '0.5px solid #1A1A1A', borderRadius: 8, padding: '10px 18px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }}/>
                    <span style={{ fontSize: 12, color: '#333', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>Week Locked</span>
                  </div>
                )}
              </div>

            ) : (

              /* Active registration card */
              <div style={{ background: '#0C0C0C', border: `0.5px solid ${paymentStatus === 'confirmed' ? '#003E31' : paymentStatus === 'pending' ? '#332200' : '#1A1A1A'}`, borderRadius: 16, overflow: 'hidden' }}>

                {/* Card header */}
                <div style={{ background: paymentStatus === 'confirmed' ? '#003E31' : '#111', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontFamily: "'Arial Black', Arial", fontSize: 22, fontWeight: 900, color: '#BEFF00' }}>
                      Batch {batch?.label ?? '—'}
                    </div>
                    <div style={{ fontSize: 11, color: paymentStatus === 'confirmed' ? '#BEFF00' : '#666', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: .7 }}>
                      {activeReg.game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}
                    </div>
                  </div>
                  <PaymentBadge status={paymentStatus} />
                </div>

                {/* Card body */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
                    <InfoTile label="Your slot" value={activeReg.slot_number ? `#${activeReg.slot_number}` : 'Pending'} />
                    <InfoTile label="Batch status" value={batch?.status ?? '—'} highlight={batch?.status === 'full'} />
                    <InfoTile label="Slots filled" value={batch ? `${batch.slots_filled} / ${batch.max_slots}` : '—'} />
                    <InfoTile label="Week" value={`Week ${activeReg.week_number}`} />
                  </div>

                  {/* Progress bar */}
                  {batch && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>Batch progress</span>
                        <span style={{ fontSize: 10, color: '#BEFF00', fontWeight: 700 }}>{batch.slots_filled}/8 players</span>
                      </div>
                      <div style={{ height: 4, background: '#1A1A1A', borderRadius: 2 }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(batch.slots_filled / batch.max_slots) * 100}%` }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const }}
                          style={{ height: 4, background: '#BEFF00', borderRadius: 2 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Match date */}
                  {hasMatchDate ? (
                    <motion.div
                      initial={{ opacity: 0, scale: .98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ background: '#003E31', border: '0.5px solid #005544', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                    >
                      <div style={{ width: 40, height: 40, background: '#BEFF00', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003E31" strokeWidth="2.5" strokeLinecap="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3, opacity: .7 }}>Match confirmed</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                          {format(new Date(batch.match_date), 'EEEE, MMM d · h:mm a')}
                        </div>
                        {batch.match_venue && (
                          <div style={{ fontSize: 12, color: '#BEFF00', marginTop: 2, opacity: .7 }}>{batch.match_venue}</div>
                        )}
                      </div>
                    </motion.div>
                  ) : paymentStatus === 'confirmed' ? (
                    <div style={{ background: '#111', border: '0.5px solid #1A1A1A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF9F27', animation: 'pulse 2s infinite' }}/>
                      <span style={{ fontSize: 13, color: '#555' }}>Match date will be set once your batch is full</span>
                    </div>
                  ) : paymentStatus === 'pending' ? (
                    <div style={{ background: '#1a1000', border: '0.5px solid #332200', borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#EF9F27', marginBottom: 4 }}>Payment pending verification</div>
                      <div style={{ fontSize: 12, color: '#554400', lineHeight: 1.5 }}>Our team is checking your transfer. You'll be notified once confirmed.</div>
                    </div>
                  ) : (
                    <div style={{ background: '#1a0000', border: '0.5px solid #330000', borderRadius: 12, padding: '14px 18px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#E24B4A', marginBottom: 4 }}>Payment not confirmed</div>
                      <div style={{ fontSize: 12, color: '#550000', lineHeight: 1.5 }}>Your payment was declined or expired. Register again to secure a spot.</div>
                      <Link href="/register" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#BEFF00', textDecoration: 'none', fontWeight: 700 }}>Try again →</Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── WEEK STATUS BANNER ── */}
          <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
            <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: week?.status === 'open' ? '#BEFF00' : '#333', flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: week?.status === 'open' ? '#fff' : '#444', fontWeight: 600 }}>
                  {week?.status === 'open'
                    ? `Week ${week.week_number} registrations are open`
                    : `Week ${week?.week_number ?? ''} registrations are locked`}
                </span>
              </div>
              {week?.status === 'open' && !activeReg && (
                <Link href="/register" style={{ fontSize: 12, color: '#BEFF00', textDecoration: 'none', fontWeight: 700, border: '0.5px solid #BEFF00', borderRadius: 6, padding: '5px 12px' }}>
                  Register →
                </Link>
              )}
            </div>
          </motion.div>

          {/* ── HISTORY ── */}
          {data.history?.length > 1 && (
            <motion.div variants={fadeUp}>
              <div style={{ fontSize: 10, letterSpacing: 4, color: '#333', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Registration history</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.history.slice(1).map((r: any) => (
                  <div key={r.id} style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                        Batch {r.batch?.label} · {r.game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}
                      </div>
                      <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>Week {r.week_number}</div>
                    </div>
                    <PaymentBadge status={r.payment_status} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── WHATSAPP GROUP CARD ── */}
          <WhatsAppGroupCard
            registrations={data.registrations ?? []}
            notifications={notifications}
          />

        </motion.div>
      </main>
    </div>
  )
}

function PlayerAvatar({ player, size }: { player: any; size: number }) {
  if (!player) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#003E31', border: '0.5px solid #005544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 900, color: '#BEFF00', fontFamily: "'Arial Black',Arial", flexShrink: 0 }}>?</div>
  )
  const av = player.avatar_url
  if (av) {
    try {
      const c = JSON.parse(av)
      if (c.type === 'emoji') {
        const bgs = ['#003E31','#1a0000','#0a0a2a','#1a0a00','#001a1a','#1a001a']
        return <div style={{ width: size, height: size, borderRadius: '50%', background: bgs[c.color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45, flexShrink: 0 }}>{c.emoji}</div>
      }
    } catch {}
    if (av.startsWith('http'))
      return <img src={av} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #BEFF00' }}/>
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#003E31', border: '0.5px solid #005544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 900, color: '#BEFF00', fontFamily: "'Arial Black',Arial", flexShrink: 0 }}>
      {(player.nickname ?? '?').slice(0,2).toUpperCase()}
    </div>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    confirmed: { label: 'Confirmed', bg: '#003E31', color: '#BEFF00', border: '#005544' },
    pending:   { label: 'Pending',   bg: '#1a1000', color: '#EF9F27', border: '#332200' },
    failed:    { label: 'Failed',    bg: '#1a0000', color: '#E24B4A', border: '#330000' },
    expired:   { label: 'Expired',   bg: '#111',    color: '#444',    border: '#1A1A1A' },
  }
  const s = map[status] ?? map['pending']
  return (
    <div style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: 2, textTransform: 'uppercase' }}>
      {s.label}
    </div>
  )
}

function InfoTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: '#080808', border: '0.5px solid #111', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: highlight ? '#BEFF00' : '#fff', fontFamily: "'Arial Black', Arial" }}>{value}</div>
    </div>
  )
}

function WhatsAppGroupCard({ registrations, notifications }: {
  registrations: any[]
  notifications: any[]
}) {
  // First check notifications for whatsapp_link type
  const linkNotif = notifications?.find(
    (n: any) => n.type === 'whatsapp_link' && n.body?.startsWith('http')
  )

  // Then check registrations for batch whatsapp_link
  const activeReg = registrations?.find(
    (r: any) => r.payment_status === 'confirmed' && r.batch?.whatsapp_link
  )

  const confirmedReg = registrations?.find(
    (r: any) => r.payment_status === 'confirmed'
  )

  // Get the link — from notification or from batch
  const waLink = linkNotif?.body || activeReg?.batch?.whatsapp_link || null
  const batchLabel = activeReg?.batch?.label || ''

  // Only show if player has a confirmed registration
  if (!confirmedReg) return null

  return (
    <motion.div variants={fadeUp} style={{ marginTop: 12 }}>
      {waLink ? (
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            background: '#003E31',
            border: '1px solid #BEFF00',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer'
          }}>
            {/* WhatsApp icon */}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 14, fontWeight: 900, color: '#BEFF00', marginBottom: 2 }}>
                Join WhatsApp Group
              </div>
              <div style={{ fontSize: 11, color: '#BEFF00', opacity: .6 }}>
                {batchLabel ? `Batch ${batchLabel} · ` : ''}Tap to join
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BEFF00" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </a>
      ) : (
        <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#111', border: '0.5px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 2 }}>WhatsApp Group</div>
            <div style={{ fontSize: 11, color: '#222' }}>Not available yet — admin will send soon</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF9F27', flexShrink: 0 }}/>
        </div>
      )}
    </motion.div>
  )
}

