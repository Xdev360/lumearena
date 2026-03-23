'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPlayers() {
  const [players, setPlayers]   = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirm, setConfirm]   = useState<string | null>(null)

  useEffect(() => { fetchPlayers() }, [])

  async function fetchPlayers() {
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('id, nickname, full_name, email, whatsapp, avatar_url, total_points, total_matches, total_wins, created_at, onboarded')
      .order('created_at', { ascending: false })
    if (data) setPlayers(data)
    setLoading(false)
  }

  async function deleteUser(id: string) {
    setDeleting(id)
    await fetch('/api/admin/delete-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: id })
    })
    setPlayers(prev => prev.filter(p => p.id !== id))
    setDeleting(null); setConfirm(null)
  }

  const filtered = players.filter(p =>
    !search ||
    p.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ color: '#fff', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Admin</div>
          <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>
            User Base <span style={{ fontSize: 16, color: '#333', fontWeight: 400 }}>({players.length})</span>
          </h1>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search nickname or email..."
          style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 9, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', width: 240 }}
          onFocus={e => e.target.style.borderColor = '#BEFF00'}
          onBlur={e  => e.target.style.borderColor = '#1A1A1A'}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total users',    value: players.length },
          { label: 'Onboarded',      value: players.filter(p => p.onboarded).length },
          { label: 'Have played',    value: players.filter(p => p.total_matches > 0).length },
        ].map(s => (
          <div key={s.label} style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: '#333', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 22, fontWeight: 900, color: '#BEFF00' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#333', textAlign: 'center', padding: 48 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#333', textAlign: 'center', padding: 48 }}>No players found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#0C0C0C', border: '0.5px solid #111', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>

              <PlayerAvatar player={p} size={40}/>

              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {p.nickname ? `@${p.nickname}` : 'No nickname'}
                  </span>
                  {!p.onboarded && (
                    <span style={{ fontSize: 9, background: '#1a1000', border: '0.5px solid #332200', color: '#EF9F27', padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>
                      SETUP INCOMPLETE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{p.email}</div>
                {p.whatsapp && <div style={{ fontSize: 11, color: '#333' }}>{p.whatsapp}</div>}
              </div>

              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, color: '#BEFF00' }}>{p.total_points ?? 0}</div>
                <div style={{ fontSize: 9, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>pts</div>
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm(`Reset ${p.nickname}'s balance to 0?`)) return
                  await fetch('/api/admin/clear-balance', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ player_id: p.id })
                  })
                  fetchPlayers()
                }}
                style={{ background: 'none', border: '0.5px solid #1A1A1A', color: '#333', borderRadius: 7, padding: '5px 10px', fontSize: 10, cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#EF9F27'; (e.currentTarget as HTMLElement).style.color='#EF9F27' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#1A1A1A'; (e.currentTarget as HTMLElement).style.color='#333' }}
              >
                Clear pts
              </button>
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.total_matches ?? 0}</div>
                <div style={{ fontSize: 9, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>matches</div>
              </div>
              <div style={{ fontSize: 10, color: '#333', minWidth: 80 }}>
                Joined {p.created_at ? format(new Date(p.created_at), 'MMM d') : '—'}
              </div>

              {confirm === p.id ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => deleteUser(p.id)} disabled={deleting === p.id}
                    style={{ background: '#1a0000', border: '0.5px solid #E24B4A', color: '#E24B4A', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {deleting === p.id ? '…' : 'Confirm'}
                  </button>
                  <button onClick={() => setConfirm(null)}
                    style={{ background: 'none', border: '0.5px solid #1A1A1A', color: '#444', borderRadius: 7, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirm(p.id)}
                  style={{ background: 'none', border: '0.5px solid #1A1A1A', color: '#333', borderRadius: 7, padding: '7px 12px', fontSize: 11, cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#E24B4A'; (e.currentTarget as HTMLElement).style.color='#E24B4A' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#1A1A1A'; (e.currentTarget as HTMLElement).style.color='#333' }}>
                  Delete
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlayerAvatar({ player, size }: { player: any; size: number }) {
  if (player.avatar_url) {
    try {
      const c = JSON.parse(player.avatar_url)
      if (c.type === 'emoji') {
        const bgs = ['#003E31','#1a0000','#0a0a2a','#1a0a00','#001a1a','#1a001a']
        return <div style={{ width: size, height: size, borderRadius: '50%', background: bgs[c.color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.45 }}>{c.emoji}</div>
      }
    } catch {}
    if (player.avatar_url.startsWith('http'))
      return <img src={player.avatar_url} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/>
  }
  return <div style={{ width: size, height: size, borderRadius: '50%', background: '#003E31', border: '0.5px solid #005544', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.35, fontWeight: 900, color: '#BEFF00', fontFamily: "'Arial Black',Arial" }}>{(player.nickname ?? '?').slice(0,2).toUpperCase()}</div>
}
