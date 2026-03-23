'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Player = {
  id: string; player_id: string; nickname: string
  avatar_url: string | null; total_points: number
  total_wins: number; total_losses: number
}

function AvatarSmall({ av, nick, size = 32 }: { av: string | null; nick: string; size?: number }) {
  if (av) {
    try {
      const c = JSON.parse(av)
      if (c.type === 'emoji') {
        const bgs = ['#003E31','#1a0000','#0a0a2a','#1a0a00','#001a1a','#1a001a']
        return <div style={{ width: size, height: size, borderRadius: '50%', background: bgs[c.color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.45 }}>{c.emoji}</div>
      }
    } catch {}
    if (av.startsWith('http'))
      return <img src={av} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/>
  }
  return <div style={{ width: size, height: size, borderRadius: '50%', background: '#003E31', border: '0.5px solid #005544', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.35, fontWeight: 900, color: '#BEFF00', fontFamily: "'Arial Black',Arial" }}>{nick.slice(0,2).toUpperCase()}</div>
}

export default function AdminPoints() {
  const [batches, setBatches]     = useState<any[]>([])
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [players, setPlayers]     = useState<Record<string, Player[]>>({})
  const [active, setActive]       = useState<Player | null>(null)
  const [matchType, setMatchType] = useState<'win'|'loss'>('win')
  const [goals, setGoals]         = useState(0)
  const [game, setGame]           = useState<'FC26'|'MK'>('FC26')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [history, setHistory]     = useState<any[]>([])
  const [gameFilter, setGameFilter] = useState<'all'|'FC26'|'MK'>('all')
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Player[]>([])
  const [showDrop, setShowDrop] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  // Autocomplete search
  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDrop(false); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('players')
        .select('id, nickname, avatar_url, total_points, total_wins, total_losses')
        .ilike('nickname', `${query.replace('@','')}%`)
        .limit(6)
      if (data) {
        const mapped = data.map((p: any) => ({
          id: p.id, player_id: p.id,
          nickname: p.nickname, avatar_url: p.avatar_url,
          total_points: p.total_points ?? 0,
          total_wins: p.total_wins ?? 0,
          total_losses: p.total_losses ?? 0,
        }))
        setResults(mapped)
        setShowDrop(true)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setShowDrop(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    supabase.from('batches').select('*')
      .order('week_number', { ascending: false })
      .order('label')
      .then(({ data }) => { if (data) setBatches(data) })

    supabase.from('points_log')
      .select('*, player:players(nickname, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setHistory(data) })
  }, [])

  async function loadPlayers(batchId: string) {
    if (players[batchId]) return
    const { data } = await supabase
      .from('registrations')
      .select(`
        id, player_id, slot_number,
        player:players(id, nickname, avatar_url, total_points, total_wins, total_losses)
      `)
      .eq('batch_id', batchId)
      .eq('payment_status', 'confirmed')
      .order('slot_number')

    if (data) {
      const mapped = data.map((r: any) => ({
        id:           r.id,
        player_id:    r.player_id,
        nickname:     r.player?.nickname ?? 'Unknown',
        avatar_url:   r.player?.avatar_url ?? null,
        total_points: r.player?.total_points ?? 0,
        total_wins:   r.player?.total_wins   ?? 0,
        total_losses: r.player?.total_losses ?? 0,
      }))
      setPlayers(prev => ({ ...prev, [batchId]: mapped }))
    }
  }

  function toggleBatch(batchId: string) {
    if (expanded === batchId) {
      setExpanded(null); setActive(null)
    } else {
      setExpanded(batchId)
      loadPlayers(batchId)
      setActive(null)
    }
  }

  const pointsPreview = matchType === 'win' ? 3 + goals : 1

  async function savePoints() {
    if (!active) return
    setSaving(true); setSaved(false)

    const res = await fetch('/api/admin/post-points', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: [{
          player_id:    active.player_id,
          nickname:     active.nickname,
          match_type:   matchType,
          goals_scored: matchType === 'win' ? goals : 0,
          game,
          week_number:  null,
          batch_id:     expanded,
          prize:        0
        }]
      })
    })

    if (res.ok) {
      setSaved(true)
      setGoals(0)
      setMatchType('win')

      if (expanded) {
        const { data } = await supabase
          .from('players')
          .select('id, nickname, avatar_url, total_points, total_wins, total_losses')
          .eq('id', active.player_id)
          .single()

        if (data) {
          setPlayers(prev => ({
            ...prev,
            [expanded]: prev[expanded].map(p =>
              p.player_id === active.player_id
                ? { ...p, total_points: data.total_points, total_wins: data.total_wins, total_losses: data.total_losses }
                : p
            )
          }))
        }

        const { data: hist } = await supabase
          .from('points_log')
          .select('*, player:players(nickname, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(10)
        if (hist) setHistory(hist)
      }

      setTimeout(() => { setSaved(false); setActive(null) }, 1500)
    }
    setSaving(false)
  }

  const filtered = gameFilter === 'all' ? batches : batches.filter(b => b.game === gameFilter)

  return (
    <div style={{ color: '#fff', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Admin</div>
        <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>Input Points</h1>
        <p style={{ fontSize: 12, color: '#444', marginTop: 6 }}>Click a batch → select a player → enter their result</p>
      </div>

      {/* ── SEARCH BAR AT TOP ── */}
      <div style={{ position: 'relative', marginBottom: 20 }} ref={dropRef}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>
          Quick search — type nickname
        </label>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setActive(null) }}
          placeholder="Start typing @nickname..."
          style={{ width: '100%', background: '#0C0C0C', border: '1px solid #1A1A1A', borderRadius: 10, padding: '13px 14px', fontSize: 15, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s' }}
          onFocus={e => { e.target.style.borderColor = '#BEFF00'; if (results.length) setShowDrop(true) }}
          onBlur={e  => e.target.style.borderColor = '#1A1A1A'}
          autoComplete="off"
        />

        <AnimatePresence>
          {showDrop && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0C0C0C', border: '0.5px solid #BEFF00', borderRadius: 10, overflow: 'hidden', zIndex: 100, marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,.7)' }}>
              {results.map(p => (
                <div key={p.player_id ?? p.id}
                  onClick={() => { setActive(p); setQuery(`@${p.nickname}`); setShowDrop(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid #111', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#003E31'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <AvatarSmall av={p.avatar_url} nick={p.nickname} size={32}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>@{p.nickname}</div>
                    <div style={{ fontSize: 11, color: '#444' }}>{p.total_points} pts · {p.total_wins}W · {p.total_losses}L</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: '0.5px', background: '#1A1A1A' }}/>
        <span style={{ fontSize: 10, color: '#333', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>or browse by batch</span>
        <div style={{ flex: 1, height: '0.5px', background: '#1A1A1A' }}/>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all','FC26','MK'] as const).map(g => (
          <button key={g} onClick={() => setGameFilter(g)}
            style={{ padding: '6px 14px', borderRadius: 7, border: '0.5px solid #1A1A1A', background: gameFilter === g ? '#BEFF00' : '#0C0C0C', color: gameFilter === g ? '#080808' : '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}>
            {g === 'all' ? 'All' : g}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ color: '#333', textAlign: 'center', padding: 32, fontSize: 13 }}>No batches found</div>
          )}
          {filtered.map(batch => (
            <div key={batch.id} style={{ background: '#0C0C0C', border: `0.5px solid ${expanded === batch.id ? '#BEFF00' : '#111'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}>

              <div onClick={() => toggleBatch(batch.id)}
                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 16, fontWeight: 900, color: '#fff' }}>
                      Batch {batch.label}
                    </span>
                    <span style={{ fontSize: 10, color: batch.game === 'FC26' ? '#fff' : '#E24B4A', letterSpacing: 2, opacity: .5 }}>
                      {batch.game}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                    {batch.slots_filled}/{batch.max_slots} players · Week {batch.week_number}
                  </div>
                </div>
                <span style={{ fontSize: 14, color: expanded === batch.id ? '#BEFF00' : '#333' }}>
                  {expanded === batch.id ? '▲' : '▼'}
                </span>
              </div>

              <AnimatePresence>
                {expanded === batch.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    style={{ overflow: 'hidden', borderTop: '0.5px solid #111' }}>
                    {!players[batch.id] ? (
                      <div style={{ padding: '16px 14px', color: '#333', fontSize: 13 }}>Loading players…</div>
                    ) : players[batch.id].length === 0 ? (
                      <div style={{ padding: '16px 14px', color: '#333', fontSize: 13 }}>No confirmed players in this batch</div>
                    ) : (
                      players[batch.id].map(p => (
                        <div key={p.player_id}
                          onClick={() => { setActive(p); setSaved(false); setGoals(0); setMatchType('win'); setGame(batch.game as 'FC26'|'MK') }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: active?.player_id === p.player_id ? '#003E31' : 'transparent', borderBottom: '0.5px solid #0a0a0a', transition: 'background .15s' }}
                          onMouseEnter={e => { if (active?.player_id !== p.player_id) (e.currentTarget as HTMLElement).style.background = '#0a1a0a' }}
                          onMouseLeave={e => { if (active?.player_id !== p.player_id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                          <AvatarSmall av={p.avatar_url} nick={p.nickname} size={30}/>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: active?.player_id === p.player_id ? '#BEFF00' : '#fff' }}>
                              {p.nickname}
                            </div>
                            <div style={{ fontSize: 10, color: '#555' }}>{p.total_points} pts · {p.total_wins}W · {p.total_losses}L</div>
                          </div>
                          {active?.player_id === p.player_id && (
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#BEFF00', flexShrink: 0 }}/>
                          )}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <AnimatePresence>
            {active ? (
              <motion.div key="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: '#0C0C0C', border: '0.5px solid #003E31', borderRadius: 14, padding: '16px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <AvatarSmall av={active.avatar_url} nick={active.nickname} size={40}/>
                  <div>
                    <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 15, fontWeight: 900, color: '#fff' }}>
                      {active.nickname}
                    </div>
                    <div style={{ fontSize: 11, color: '#BEFF00', opacity: .7 }}>
                      {active.total_points} pts current
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {(['win','loss'] as const).map(m => (
                    <button key={m} onClick={() => { setMatchType(m); if (m === 'loss') setGoals(0) }}
                      style={{ flex: 1, padding: '11px', borderRadius: 9, border: `1.5px solid ${matchType === m ? (m === 'win' ? '#BEFF00' : '#E24B4A') : '#1A1A1A'}`, background: matchType === m ? (m === 'win' ? '#003E31' : '#1a0000') : '#080808', color: matchType === m ? (m === 'win' ? '#BEFF00' : '#E24B4A') : '#555', fontSize: 13, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
                      {m === 'win' ? 'WIN' : 'LOSS'}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {matchType === 'win' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>Goals scored</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setGoals(Math.max(0, goals - 1))}
                          style={{ width: 38, height: 38, borderRadius: 8, background: '#080808', border: '0.5px solid #1A1A1A', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <div style={{ flex: 1, textAlign: 'center', fontFamily: "'Arial Black',Arial", fontSize: 30, fontWeight: 900, color: '#BEFF00' }}>{goals}</div>
                        <button onClick={() => setGoals(goals + 1)}
                          style={{ width: 38, height: 38, borderRadius: 8, background: '#003E31', border: '0.5px solid #BEFF00', color: '#BEFF00', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ background: '#080808', borderRadius: 9, padding: '10px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#555' }}>
                    {matchType === 'win' ? `3 base + ${goals} goals` : 'Loss'}
                  </span>
                  <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 20, fontWeight: 900, color: '#BEFF00' }}>
                    +{pointsPreview} pts
                  </span>
                </div>

                <button onClick={savePoints} disabled={saving}
                  style={{ width: '100%', minHeight: 46, background: saved ? '#003E31' : saving ? '#111' : '#BEFF00', color: saved ? '#BEFF00' : saving ? '#333' : '#080808', border: saved ? '0.5px solid #BEFF00' : 'none', borderRadius: 10, fontSize: 13, fontWeight: 900, fontFamily: "'Arial Black',Arial", letterSpacing: 1, cursor: saving ? 'wait' : 'pointer', transition: 'all .2s' }}>
                  {saving ? 'SAVING…' : saved ? '✓ SAVED' : 'SAVE POINTS →'}
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 14, padding: '28px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>👆</div>
                <div style={{ fontSize: 13, color: '#444' }}>Open a batch and click a player</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 10 }}>Recent entries</div>
            {history.length === 0 ? (
              <div style={{ color: '#222', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No entries yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((h: any, i: number) => (
                  <div key={h.id ?? i} style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 9, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AvatarSmall av={h.player?.avatar_url ?? null} nick={h.player?.nickname ?? '?'} size={26}/>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{h.player?.nickname ?? '—'}</div>
                        <div style={{ fontSize: 10, color: '#444' }}>{h.game} · {h.match_type === 'win' ? `Win ${h.goals_scored}g` : 'Loss'}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 16, fontWeight: 900, color: '#BEFF00' }}>+{h.points_earned}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
