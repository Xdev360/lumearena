'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Game = 'FC26' | 'MK'

type BatchStatus = 'open' | 'locked' | 'full' | 'completed'

type Batch = {
  id: string
  label: string
  game: Game
  week_number: number
  status: BatchStatus
  slots_filled: number
  max_slots: number
  match_date: string | null
  match_venue: string | null
}

type BatchPlayer = {
  id: string
  player_id: string
  full_name: string
  whatsapp: string
  slot_number: number
  payment_status: string
  game: Game
}

export default function AdminBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [players, setPlayers] = useState<Record<string, BatchPlayer[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [setting, setSetting] = useState<string | null>(null)

  const [matchDate, setMatchDate] = useState('')
  const [venue, setVenue] = useState('')
  const [saving, setSaving] = useState(false)
  const [gameFilter, setGameFilter] = useState<'all' | Game>('all')

  useEffect(() => { fetchBatches() }, [])

  async function fetchBatches() {
    const { data } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setBatches(data as Batch[])
  }

  async function deleteBatch(batchId: string, label: string) {
    if (!window.confirm(`Delete Batch ${label}? Players will be notified.`)) return

    const res = await fetch('/api/admin/delete-batch', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ batch_id: batchId })
    })

    const data = await res.json()
    if (data.success) {
      setBatches(prev => prev.filter(b => b.id !== batchId))
      setExpanded(null)
    } else {
      alert('Delete failed: ' + data.error)
    }
  }

  async function clearAllBatches(weekNumber: number) {
    if (!window.confirm(`Clear ALL batches for Week ${weekNumber}? This cannot be undone.`)) return
    const weekBatches = batches.filter(b => b.week_number === weekNumber)
    for (const b of weekBatches) {
      const res = await fetch('/api/admin/delete-batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: b.id })
      })
      const data = await res.json()
      if (!data.success) alert('Delete failed for ' + b.label + ': ' + data.error)
    }
    fetchBatches()
  }

  async function loadPlayers(batchId: string) {
    if (players[batchId]) {
      setExpanded(batchId)
      return
    }

    const { data } = await supabase
      .from('registrations')
      .select('id, player_id, full_name, whatsapp, slot_number, payment_status, game')
      .eq('batch_id', batchId)
      .order('slot_number')

    if (data) setPlayers(prev => ({ ...prev, [batchId]: data as BatchPlayer[] }))
    setExpanded(batchId)
  }

  async function saveMatchDate(batchId: string) {
    if (!matchDate) return
    setSaving(true)

    const { error } = await supabase
      .from('batches')
      .update({ match_date: new Date(matchDate).toISOString(), match_venue: venue })
      .eq('id', batchId)

    if (!error) {
      const batchPlayers = players[batchId] ?? []
      const batch = batches.find(b => b.id === batchId)
      const dateStr = format(new Date(matchDate), 'EEEE, MMM d at h:mm a')

      if (batchPlayers.length > 0) {
        await supabase.from('notifications').insert(
          batchPlayers.map(p => ({
            player_id: p.player_id,
            title: 'Match date confirmed',
            body: `Your Batch ${batch?.label} match is set for ${dateStr}${venue ? ` at ${venue}` : ''}`,
            type: 'match_date',
          })),
        )
      }

      setSetting(null)
      setMatchDate('')
      setVenue('')
      fetchBatches()
    }

    setSaving(false)
  }

  const filtered =
    gameFilter === 'all' ? batches : batches.filter(b => b.game === gameFilter)

  const statusColor: Record<BatchStatus, string> = {
    open: '#BEFF00',
    full: '#EF9F27',
    completed: '#555',
    locked: '#444',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Batches</div>
          <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>Batch Manager</h1>
        </div>
        {[...new Set(batches.map(b => b.week_number))].sort((a, b) => b - a).map(wn => (
          <button key={wn} onClick={() => clearAllBatches(wn)}
            style={{ background: 'none', border: '0.5px solid #E24B4A', color: '#E24B4A', borderRadius: 7, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>
            Clear Week {wn}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['all', 'FC26', 'MK'] as const).map(g => (
          <button
            key={g}
            onClick={() => setGameFilter(g)}
            style={{ padding: '7px 16px', borderRadius: 7, border: '0.5px solid #1A1A1A', background: gameFilter === g ? '#BEFF00' : '#0C0C0C', color: gameFilter === g ? '#080808' : '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1, transition: 'all .15s' }}
          >
            {g === 'all' ? 'All' : g === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(batch => (
          <motion.div
            key={batch.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: '#0C0C0C', border: `0.5px solid ${batch.status === 'full' ? '#003E31' : '#111'}`, borderRadius: 14, overflow: 'hidden' }}
          >
            {/* Batch header */}
            <div
              style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', cursor: 'pointer' }}
              onClick={() => (expanded === batch.id ? setExpanded(null) : void loadPlayers(batch.id))}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, color: '#fff' }}>Batch {batch.label}</span>
                  <span style={{ fontSize: 10, color: batch.game === 'FC26' ? '#fff' : '#E24B4A', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: .6 }}>
                    {batch.game === 'FC26' ? 'EA FC 26' : 'MK'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: statusColor[batch.status] ?? '#555', fontWeight: 700 }}>
                    {batch.slots_filled}/{batch.max_slots} players
                  </span>
                  <div style={{ width: 80, height: 3, background: '#1A1A1A', borderRadius: 2 }}>
                    <div
                      style={{
                        height: 3,
                        background: statusColor[batch.status] ?? '#333',
                        borderRadius: 2,
                        width: `${(batch.slots_filled / batch.max_slots) * 100}%`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, background: '#111', border: '0.5px solid #1A1A1A', color: statusColor[batch.status] ?? '#555', padding: '2px 8px', borderRadius: 5, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                    {batch.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {batch.match_date && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#BEFF00', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Match set</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{format(new Date(batch.match_date), 'MMM d, h:mm a')}</div>
                    {batch.match_venue && <div style={{ fontSize: 11, color: '#444' }}>{batch.match_venue}</div>}
                  </div>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setSetting(batch.id); void loadPlayers(batch.id) }}
                  style={{ background: '#0C0C0C', border: '0.5px solid #BEFF00', color: '#BEFF00', borderRadius: 8, padding: '8px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}
                >
                  {batch.match_date ? 'EDIT DATE' : 'SET DATE'}
                </button>
                <button onClick={e => { e.stopPropagation(); deleteBatch(batch.id, batch.label) }}
                  style={{ background: 'none', border: '0.5px solid #1A1A1A', color: '#444', borderRadius: 7, padding: '6px 12px', fontSize: 10, cursor: 'pointer', letterSpacing: 1 }}
                  title="Delete batch"
                >
                  Delete
                </button>
                <div style={{ color: '#333', fontSize: 16 }}>{expanded === batch.id ? '▲' : '▼'}</div>
              </div>
            </div>

            {/* Set match date form */}
            {setting === batch.id && (
              <div style={{ padding: '0 18px 16px', borderTop: '0.5px solid #111' }}>
                <div style={{ paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 6 }}>Match date & time</label>
                    <input
                      type="datetime-local"
                      value={matchDate}
                      onChange={e => setMatchDate(e.target.value)}
                      style={{ width: '100%', background: '#080808', border: '1px solid #BEFF00', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none', colorScheme: 'dark' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 6 }}>Venue (optional)</label>
                    <input
                      type="text"
                      placeholder="14 Aba Road, PH"
                      value={venue}
                      onChange={e => setVenue(e.target.value)}
                      style={{ width: '100%', background: '#080808', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => saveMatchDate(batch.id)}
                      disabled={!matchDate || saving}
                      style={{ background: !matchDate || saving ? '#111' : '#BEFF00', color: !matchDate || saving ? '#333' : '#080808', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 12, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: !matchDate || saving ? 'not-allowed' : 'pointer', letterSpacing: 1 }}
                    >
                      {saving ? 'SAVING…' : 'SAVE & NOTIFY'}
                    </button>
                    <button
                      onClick={() => setSetting(null)}
                      style={{ background: 'none', border: '0.5px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#444', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Player list */}
            {expanded === batch.id && players[batch.id] && (
              <div style={{ borderTop: '0.5px solid #111' }}>
                {players[batch.id].length === 0 ? (
                  <div style={{ padding: '16px 18px', fontSize: 13, color: '#333' }}>No players yet</div>
                ) : (
                  players[batch.id].map((p, i) => (
                    <div
                      key={p.id}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < players[batch.id].length - 1 ? '0.5px solid #0a0a0a' : 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 24, height: 24, background: '#111', border: '0.5px solid #1A1A1A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#BEFF00', fontFamily: "'Arial Black',Arial" }}>
                          {p.slot_number ?? i + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.full_name}</div>
                          <div style={{ fontSize: 11, color: '#333' }}>{p.whatsapp}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: p.payment_status === 'confirmed' ? '#BEFF00' : '#E24B4A', letterSpacing: 2, textTransform: 'uppercase' }}>
                        {p.payment_status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

