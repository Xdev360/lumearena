'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Payment = {
  id: string; full_name: string; whatsapp: string
  game: string; amount: number; status: string
  reference: string; created_at: string; registration_id: string
  player_id: string
}

type Filter = 'pending_review' | 'confirmed' | 'failed' | 'all'

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filter, setFilter]     = useState<Filter>('pending_review')
  const [newPing, setNewPing]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission()
    }

    const ch = supabase.channel('admin-payments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, payload => {
        const p = payload.new as Payment
        setPayments(prev => [p, ...prev])
        setNewPing(true)
        if (Notification.permission === 'granted') {
          new Notification('LUME Arena — New Payment', {
            body: `${p.full_name} · ${p.game} · ₦${p.amount.toLocaleString()}`
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' }, () => {
        fetchPayments()
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  useEffect(() => { fetchPayments() }, [filter])

  async function fetchPayments() {
    setLoading(true)
    const q = supabase.from('payments').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q.eq('status', filter)
    const { data } = await q
    if (data) setPayments(data)
    setLoading(false)
  }

  async function decide(payment: Payment, decision: 'confirmed' | 'failed') {
    setActing(payment.id)
    const res = await fetch('/api/admin/payment-decision', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ payment_id: payment.id, registration_id: payment.registration_id, player_id: payment.player_id, decision })
    })
    if (res.ok) fetchPayments()
    setActing(null)
  }

  const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
    pending_review: { color: '#EF9F27', bg: '#1a1000', border: '#332200' },
    confirmed:      { color: '#BEFF00', bg: '#003E31', border: '#005544' },
    failed:         { color: '#E24B4A', bg: '#1a0000', border: '#330000' },
    pending:        { color: '#555',    bg: '#111',    border: '#1A1A1A' },
    expired:        { color: '#333',    bg: '#0a0a0a', border: '#111'    },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Payments</div>
          <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>Payment Review</h1>
        </div>
        <AnimatePresence>
          {newPing && (
            <motion.div
              initial={{ opacity: 0, scale: .9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setNewPing(false); setFilter('pending_review') }}
              style={{ background: '#1a1000', border: '1px solid #EF9F27', color: '#EF9F27', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}
            >
              NEW PAYMENT — tap to review
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['pending_review', 'confirmed', 'failed', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: '7px 16px', borderRadius: 7, border: '0.5px solid #1A1A1A', background: filter === f ? '#BEFF00' : '#0C0C0C', color: filter === f ? '#080808' : '#555', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1, transition: 'all .15s' }}
          >
            {f === 'pending_review' ? 'Pending' : f}
          </button>
        ))}
      </div>

      {/* Payment list */}
      {loading ? (
        <div style={{ color: '#333', padding: 48, textAlign: 'center' }}>Loading…</div>
      ) : payments.length === 0 ? (
        <div style={{ color: '#222', padding: 48, textAlign: 'center', fontSize: 14 }}>No {filter === 'all' ? '' : filter} payments</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {payments.map(p => {
            const ss = statusStyle[p.status] ?? statusStyle['pending']
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: '#0C0C0C', border: `0.5px solid ${p.status === 'pending_review' ? '#332200' : '#111'}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', transition: 'border-color .2s' }}
              >

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{p.full_name}</div>
                  <div style={{ fontSize: 12, color: '#444' }}>{p.whatsapp} · {p.game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}</div>
                  <div style={{ fontSize: 10, color: '#222', fontFamily: 'monospace', marginTop: 4, letterSpacing: 1 }}>{p.reference}</div>
                </div>

                <div style={{ textAlign: 'center', minWidth: 90 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#BEFF00', fontFamily: "'Arial Black',Arial", letterSpacing: -0.5 }}>₦{p.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>
                    {format(new Date(p.created_at), 'MMM d, h:mm a')}
                  </div>
                </div>

                <div style={{ background: ss.bg, border: `0.5px solid ${ss.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: ss.color, letterSpacing: 2, textTransform: 'uppercase', minWidth: 80, textAlign: 'center' }}>
                  {p.status === 'pending_review' ? 'Pending' : p.status}
                </div>

                {p.status === 'pending_review' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => decide(p, 'confirmed')}
                      disabled={acting === p.id}
                      style={{ background: acting === p.id ? '#111' : '#003E31', border: '0.5px solid #BEFF00', color: '#BEFF00', padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: acting === p.id ? 'wait' : 'pointer', letterSpacing: 1, transition: 'all .15s' }}
                    >
                      {acting === p.id ? '…' : 'ACCEPT'}
                    </button>
                    <button
                      onClick={() => decide(p, 'failed')}
                      disabled={acting === p.id}
                      style={{ background: '#1a0000', border: '0.5px solid #E24B4A', color: '#E24B4A', padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: acting === p.id ? 'wait' : 'pointer', letterSpacing: 1, transition: 'all .15s' }}
                    >
                      DECLINE
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

