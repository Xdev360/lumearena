'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminWeeks() {
  const [weeks, setWeeks]   = useState<any[]>([])
  const [acting, setActing] = useState(false)
  const [msg, setMsg]       = useState('')

  useEffect(() => { fetchWeeks() }, [])

  async function fetchWeeks() {
    const { data } = await supabase
      .from('weeks')
      .select('*')
      .order('week_number', { ascending: false })
    if (data) setWeeks(data)
  }

  async function toggleWeek(week: any) {
    setActing(true)
    const newStatus = week.status === 'open' ? 'locked' : 'open'
    const { error } = await supabase.from('weeks').update({
      status: newStatus,
      opened_at: newStatus === 'open' ? new Date().toISOString() : week.opened_at,
      closed_at: newStatus === 'locked' ? new Date().toISOString() : null,
    }).eq('id', week.id)

    if (!error) {
      setMsg(newStatus === 'open' ? `Week ${week.week_number} is now OPEN` : `Week ${week.week_number} is now LOCKED`)
      setTimeout(() => setMsg(''), 3000)
    }
    fetchWeeks()
    setActing(false)
  }

  async function createNewWeek() {
    setActing(true)
    const latest     = weeks[0]
    const nextNum    = (latest?.week_number ?? 0) + 1

    const { error } = await supabase.from('weeks').insert({
      week_number: nextNum,
      status: 'locked'
    })

    if (!error) {
      await supabase.from('batches').insert([
        { game: 'FC26', label: `A${nextNum}`, week_number: nextNum, status: 'open', slots_filled: 0, max_slots: 8 },
        { game: 'MK',   label: `A${nextNum}`, week_number: nextNum, status: 'open', slots_filled: 0, max_slots: 8 },
      ])
      setMsg(`Week ${nextNum} created with Batch A for FC26 and MK`)
      setTimeout(() => setMsg(''), 4000)
    }

    fetchWeeks()
    setActing(false)
  }

  const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
    open:   { color: '#BEFF00', bg: '#003E31', border: '#005544' },
    locked: { color: '#444',    bg: '#111',    border: '#1A1A1A' },
    closed: { color: '#333',    bg: '#0a0a0a', border: '#111'    },
  }

  return (
    <div style={{ color: '#fff', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Admin</div>
          <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>Week Manager</h1>
        </div>
        <button onClick={createNewWeek} disabled={acting}
          style={{ background: '#BEFF00', color: '#080808', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 12, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: acting ? 'wait' : 'pointer', letterSpacing: 1 }}>
          + CREATE NEW WEEK
        </button>
      </div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#003E31', border: '0.5px solid #BEFF00', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#BEFF00', marginBottom: 16 }}>
          {msg}
        </motion.div>
      )}

      <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 12, color: '#444', lineHeight: 1.6 }}>
        Only one week should be open at a time. Opening a week allows players to register. Creating a new week auto-creates Batch A for both games.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weeks.length === 0 ? (
          <div style={{ color: '#333', textAlign: 'center', padding: 32, fontSize: 13 }}>
            No weeks yet. Click &quot;Create New Week&quot; to start.
          </div>
        ) : weeks.map(week => {
          const ss = statusStyle[week.status] ?? statusStyle['locked']
          return (
            <motion.div key={week.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#0C0C0C', border: `0.5px solid ${week.status === 'open' ? '#003E31' : '#111'}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>

              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                  Week {week.week_number}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#333', flexWrap: 'wrap' }}>
                  {week.opened_at && <span>Opened: {format(new Date(week.opened_at), 'MMM d, h:mm a')}</span>}
                  {week.closed_at && <span>Locked: {format(new Date(week.closed_at), 'MMM d, h:mm a')}</span>}
                </div>
              </div>

              <div style={{ background: ss.bg, border: `0.5px solid ${ss.border}`, borderRadius: 7, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: ss.color, letterSpacing: 2, textTransform: 'uppercase' }}>
                {week.status}
              </div>

              <button onClick={() => toggleWeek(week)} disabled={acting}
                style={{
                  background:   week.status === 'open' ? '#1a0000' : '#003E31',
                  border:       `0.5px solid ${week.status === 'open' ? '#E24B4A' : '#BEFF00'}`,
                  color:        week.status === 'open' ? '#E24B4A' : '#BEFF00',
                  borderRadius: 8, padding: '9px 18px', fontSize: 12,
                  fontWeight: 700, fontFamily: "'Arial Black',Arial",
                  cursor: acting ? 'wait' : 'pointer', letterSpacing: 1
                }}>
                {week.status === 'open' ? 'LOCK WEEK' : 'OPEN WEEK'}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
