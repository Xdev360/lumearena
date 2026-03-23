'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

type Stats = { totalIn: number; profit: number; pending: number; players: number }
type Week = { week_number?: number; status?: string }
type Batch = {
  id: string
  game: string
  label?: string
  status: string
  slots_filled: number
  max_slots: number
  match_date?: string | null
}

export default function OverviewClient({
  stats,
  batches,
  week,
}: {
  stats: Stats
  batches: Batch[]
  week: Week | null
}) {
  const fc26 = batches.filter(b => b.game === 'FC26')
  const mk = batches.filter(b => b.game === 'MK')

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Admin overview</div>
        <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>
          Week {week?.week_number ?? '—'}
          <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 400, background: week?.status === 'open' ? '#003E31' : '#111', color: week?.status === 'open' ? '#BEFF00' : '#444', border: `0.5px solid ${week?.status === 'open' ? '#005544' : '#1A1A1A'}`, borderRadius: 6, padding: '3px 10px', letterSpacing: 2, textTransform: 'uppercase', verticalAlign: 'middle' }}>
            {week?.status ?? 'locked'}
          </span>
        </h1>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total collected',  value: `₦${stats.totalIn.toLocaleString()}`,  color: '#BEFF00' },
          { label: 'Est. net profit',  value: `₦${stats.profit.toLocaleString()}`,   color: '#BEFF00' },
          { label: 'Pending payments', value: stats.pending,                          color: stats.pending > 0 ? '#EF9F27' : '#333', urgent: stats.pending > 0 },
          { label: 'Total players',    value: stats.players,                          color: '#fff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0C0C0C', border: `0.5px solid ${s.urgent ? '#332200' : '#111'}`, borderRadius: 12, padding: '16px 16px' }}>
            <div style={{ fontSize: 10, color: '#333', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "'Arial Black',Arial", letterSpacing: -0.5 }}>{s.value}</div>
            {s.urgent && (
              <Link href="/admin/payments" style={{ fontSize: 11, color: '#EF9F27', textDecoration: 'none', fontWeight: 700 }}>Review now →</Link>
            )}
          </div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/admin/payments">
          <button style={{ background: stats.pending > 0 ? '#BEFF00' : '#111', color: stats.pending > 0 ? '#080808' : '#444', border: '0.5px solid #1A1A1A', borderRadius: 9, padding: '10px 20px', fontSize: 12, fontWeight: 700, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
            {stats.pending > 0 ? `${stats.pending} PENDING PAYMENT${stats.pending > 1 ? 'S' : ''}` : 'PAYMENTS'}
          </button>
        </Link>
        <Link href="/admin/weeks">
          <button style={{ background: '#111', color: '#BEFF00', border: '0.5px solid #BEFF00', borderRadius: 9, padding: '10px 20px', fontSize: 12, fontWeight: 700, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
            {week?.status === 'open' ? 'LOCK WEEK' : 'OPEN WEEK'}
          </button>
        </Link>
        <Link href="/admin/results">
          <button style={{ background: '#111', color: '#555', border: '0.5px solid #1A1A1A', borderRadius: 9, padding: '10px 20px', fontSize: 12, fontWeight: 700, fontFamily: "'Arial Black',Arial", cursor: 'pointer', letterSpacing: 1 }}>
            POST RESULTS
          </button>
        </Link>
      </motion.div>

      {/* Batch grids */}
      {[{ label: 'EA FC 26', data: fc26, color: '#fff' }, { label: 'Mortal Kombat', data: mk, color: '#E24B4A' }].map(g => (
        <motion.div key={g.label} variants={fadeUp} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: g.color, textTransform: 'uppercase', marginBottom: 10 }}>{g.label}</div>
          {g.data.length === 0 ? (
            <div style={{ fontSize: 13, color: '#222', padding: '12px 0' }}>No batches yet</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {g.data.map(b => (
                <Link key={b.id} href="/admin/batches" style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#0C0C0C', border: `0.5px solid ${b.status === 'full' ? '#003E31' : '#111'}`, borderRadius: 10, padding: '12px 14px', minWidth: 110, cursor: 'pointer', transition: 'border-color .2s' }}>
                    <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 3 }}>Batch {b.label}</div>
                    <div style={{ fontSize: 11, color: b.status === 'full' ? '#BEFF00' : '#444', fontWeight: 700, marginBottom: 6 }}>{b.slots_filled}/{b.max_slots}</div>
                    <div style={{ height: 3, background: '#1A1A1A', borderRadius: 2 }}>
                      <div style={{ height: 3, background: b.status === 'full' ? '#BEFF00' : '#003E31', borderRadius: 2, width: `${(b.slots_filled / b.max_slots) * 100}%`, transition: 'width .5s' }}/>
                    </div>
                    {b.match_date && (
                      <div style={{ fontSize: 9, color: '#BEFF00', marginTop: 6, letterSpacing: 1 }}>
                        {new Date(b.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      ))}

    </motion.div>
  )
}

