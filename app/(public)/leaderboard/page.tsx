'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] } }
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

type Player = {
  id: string
  nickname: string
  full_name: string | null
  avatar_url: string | null
  total_points: number
  total_wins: number
  total_losses: number
  total_matches: number
  total_prizes: number
}

function Avatar({ player, size = 40 }: { player: Player; size?: number }) {
  const av = player.avatar_url
  if (av) {
    try {
      const c = JSON.parse(av)
      if (c.type === 'emoji') {
        const bgs = ['#003E31','#1a0000','#0a0a2a','#1a0a00','#001a1a','#1a001a']
        return (
          <div style={{ width: size, height: size, borderRadius: '50%', background: bgs[c.color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.45 }}>
            {c.emoji}
          </div>
        )
      }
    } catch {}
    if (av.startsWith('http')) {
      return <img src={av} alt={player.nickname} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/>
    }
  }
  const initials = (player.nickname ?? '?').slice(0,2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#003E31', border: '0.5px solid #005544', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.35, fontWeight: 900, color: '#BEFF00', fontFamily: "'Arial Black',Arial" }}>
      {initials}
    </div>
  )
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all'|'FC26'|'MK'>('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('players')
        .select('id, nickname, full_name, avatar_url, total_points, total_wins, total_losses, total_matches, total_prizes')
        .gt('total_matches', 0)
        .order('total_points', { ascending: false })
        .limit(50)
      if (data) setPlayers(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 600px 250px at 50% -60px,rgba(0,62,49,.3) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,8,.95)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #111', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: '#BEFF00', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
          </div>
          <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 12, letterSpacing: 2, color: '#fff' }}>LUME ARENA</span>
        </Link>
        <Link href="/" style={{ fontSize: 12, color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </Link>
      </nav>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px', position: 'relative', zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* Header */}
          <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Points table</div>
            <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 'clamp(28px,7vw,44px)', fontWeight: 900, letterSpacing: -2, lineHeight: .9, marginBottom: 10 }}>
              LUME ARENA<br/><span style={{ color: '#BEFF00' }}>LEADERBOARD</span>
            </h1>
            <p style={{ fontSize: 13, color: '#444' }}>
              Win = 3 pts + goals scored · Loss = 1 pt
            </p>
          </motion.div>

          {/* Leaderboard rows */}
          {!loading && players.length > 0 && (
            <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {players.slice(0, 10).map((p, i) => (
                <div key={p.id} className="lb-row" style={{ border: i === 0 ? '0.5px solid #003E31' : undefined }}>
                  <div className="lb-rank">
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                  <Avatar player={p} size={36}/>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }} className="truncate">
                      {p.full_name || p.nickname}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--lemon)', opacity: .6 }}>{p.nickname}</div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lemon)' }}>{p.total_wins}W</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.total_losses}L</div>
                  </div>
                  <div className="lb-pts" style={{ color: i < 3 ? ['var(--lemon)','#aaa','var(--warn)'][i] : '#fff' }}>
                    {p.total_points}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Empty */}
          {!loading && players.length === 0 && (
            <motion.div variants={fadeUp} style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, marginBottom: 10 }}>No results yet</div>
              <p style={{ fontSize: 13, color: '#444', marginBottom: 20 }}>Leaderboard updates after each tournament. Be the first on the board.</p>
              <Link href="/register">
                <button style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 13, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
                  REGISTER NOW →
                </button>
              </Link>
            </motion.div>
          )}

          {/* Points explanation */}
          <motion.div variants={fadeUp} style={{ background: '#003E31', border: '0.5px solid #005544', borderRadius: 14, padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#BEFF00', opacity: .6, textTransform: 'uppercase', marginBottom: 4 }}>Win</div>
              <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, color: '#BEFF00' }}>3 + goals</div>
              <div style={{ fontSize: 11, color: '#BEFF00', opacity: .5 }}>Win 2-0 = 5 points</div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: '#BEFF00', opacity: .6, textTransform: 'uppercase', marginBottom: 4 }}>Loss</div>
              <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, color: '#fff' }}>1 point</div>
              <div style={{ fontSize: 11, color: '#BEFF00', opacity: .5 }}>Always, regardless of goals</div>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  )
}
