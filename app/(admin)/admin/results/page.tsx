'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Batch = {
  id: string
  label: string
  game: string
  week_number: number
  status: string
}

type RegistrationPlayer = {
  id: string
  full_name: string
  slot_number: number
}

type ResultEntry = { first: string; second: string }

export default function AdminResults() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [players, setPlayers] = useState<Record<string, RegistrationPlayer[]>>({})
  const [results, setResults] = useState<Record<string, ResultEntry>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('batches')
      .select('*')
      .in('status', ['full', 'completed'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setBatches(data as Batch[])
      })
  }, [])

  async function loadPlayers(batchId: string) {
    if (players[batchId]) return

    const { data } = await supabase
      .from('registrations')
      .select('id, full_name, slot_number')
      .eq('batch_id', batchId)
      .eq('payment_status', 'confirmed')
      .order('slot_number')

    if (data) setPlayers(prev => ({ ...prev, [batchId]: data as RegistrationPlayer[] }))
  }

  async function postResults(batch: Batch) {
    const r = results[batch.id]
    if (!r?.first || !r?.second) return

    setSaving(batch.id)

    const tournamentDate = new Date().toISOString().split('T')[0]

    await supabase.from('leaderboard').insert([
      {
        batch_id: batch.id,
        player_name: r.first,
        game: batch.game,
        position: 1,
        prize_won: 80000,
        week_number: batch.week_number,
        tournament_date: tournamentDate,
      },
      {
        batch_id: batch.id,
        player_name: r.second,
        game: batch.game,
        position: 2,
        prize_won: 50000,
        week_number: batch.week_number,
        tournament_date: tournamentDate,
      },
    ])

    await supabase.from('batches').update({ status: 'completed' }).eq('id', batch.id)

    setSaved(prev => [...prev, batch.id])
    setSaving(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Results</div>
        <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>Post Results</h1>
      </div>

      {batches.length === 0 ? (
        <div style={{ color: '#222', padding: 48, textAlign: 'center', fontSize: 14 }}>No full batches to post results for</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {batches.map(batch => {
            const isSaved = saved.includes(batch.id) || batch.status === 'completed'
            if (!players[batch.id]) loadPlayers(batch.id)
            const bPlayers = players[batch.id] ?? []
            const r = results[batch.id] ?? { first: '', second: '' }

            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: '#0C0C0C', border: `0.5px solid ${isSaved ? '#003E31' : '#1A1A1A'}`, borderRadius: 14, padding: '20px 20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, color: '#fff' }}>
                      Batch {batch.label} · {batch.game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}
                    </div>
                    <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>Week {batch.week_number}</div>
                  </div>
                  {isSaved && (
                    <div style={{ background: '#003E31', border: '0.5px solid #005544', borderRadius: 6, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#BEFF00', letterSpacing: 2, textTransform: 'uppercase' }}>
                      Results posted
                    </div>
                  )}
                </div>

                {!isSaved && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    {[
                      { place: '1st Place', key: 'first' as const, prize: '₦80,000', color: '#BEFF00' },
                      { place: '2nd Place', key: 'second' as const, prize: '₦50,000', color: '#555' },
                    ].map(pos => (
                      <div key={pos.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase' }}>{pos.place}</label>
                          <span style={{ fontSize: 12, fontWeight: 900, color: pos.color, fontFamily: "'Arial Black',Arial" }}>{pos.prize}</span>
                        </div>
                        <select
                          value={r[pos.key]}
                          onChange={e => setResults(prev => ({ ...prev, [batch.id]: { ...r, [pos.key]: e.target.value } }))}
                          style={{ width: '100%', background: '#080808', border: `1px solid ${r[pos.key] ? '#BEFF00' : '#1A1A1A'}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: r[pos.key] ? '#fff' : '#444', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
                        >
                          <option value="">Select player…</option>
                          {bPlayers.map(p => (
                            <option key={p.id} value={p.full_name}>{p.full_name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {!isSaved && (
                  <button
                    onClick={() => postResults(batch)}
                    disabled={!r.first || !r.second || saving === batch.id}
                    style={{ background: !r.first || !r.second ? '#111' : '#BEFF00', color: !r.first || !r.second ? '#333' : '#080808', border: 'none', borderRadius: 9, padding: '11px 24px', fontSize: 12, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: !r.first || !r.second ? 'not-allowed' : 'pointer', letterSpacing: 1, transition: 'all .2s' }}
                  >
                    {saving === batch.id ? 'POSTING…' : 'POST RESULTS →'}
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

