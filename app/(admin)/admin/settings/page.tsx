'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminSettings() {
  const [bank, setBank]         = useState({ bank_name: '', account_number: '', account_name: '', id: '' })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [batches, setBatches]   = useState<any[]>([])
  const [links, setLinks]       = useState<Record<string, string>>({})
  const [savingLink, setSavingLink] = useState<string | null>(null)
  const [sentBatches, setSentBatches] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load bank settings
    supabase.from('bank_settings')
      .select('*').eq('is_active', true).single()
      .then(({ data }) => { if (data) setBank(data) })

    // Load batches WITH their existing whatsapp links
    supabase.from('batches')
      .select('id, label, game, week_number, whatsapp_link, status')
      .order('week_number', { ascending: false })
      .order('label')
      .then(({ data }) => {
        if (data) {
          setBatches(data)
          // IMPORTANT: pre-fill links state from saved DB values
          const saved: Record<string, string> = {}
          data.forEach((b: any) => {
            saved[b.id] = b.whatsapp_link ?? ''
          })
          setLinks(saved)
        }
      })
  }, [])

  async function saveBank() {
    setSaving(true); setSaved(false)

    const res = await fetch('/api/admin/save-bank', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(bank)
    })

    const data = await res.json()

    if (data.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('Save failed: ' + data.error)
    }

    setSaving(false)
  }

  async function saveLink(batchId: string) {
    const link = links[batchId]?.trim()
    if (!link) { alert('Paste a WhatsApp link first'); return }

    setSavingLink(batchId)

    const res = await fetch('/api/admin/send-whatsapp-link', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ batch_id: batchId, link })
    })

    const data = await res.json()

    if (data.success) {
      setSentBatches(prev => ({ ...prev, [batchId]: true }))
      // Update local batch state so link persists in UI
      setBatches(prev => prev.map(b =>
        b.id === batchId ? { ...b, whatsapp_link: link } : b
      ))
      if (data.players_notified > 0) {
        alert(`✓ Sent to ${data.players_notified} player${data.players_notified > 1 ? 's' : ''} in Batch ${data.batch_label}`)
      } else {
        alert(`Link saved for Batch ${data.batch_label}. No confirmed players to notify yet.`)
      }
    } else {
      alert('Error: ' + data.error)
    }

    setSavingLink(null)
  }

  return (
    <div style={{ color: '#fff', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Admin</div>
        <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>Settings</h1>
      </div>

      <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 14, padding: '20px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#BEFF00', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Payment Account</div>
        <p style={{ fontSize: 12, color: '#444', marginBottom: 16, lineHeight: 1.6 }}>This account is shown to players when they make payment. Update anytime.</p>

        {[
          { label: 'Bank Name',       key: 'bank_name',       placeholder: 'Zenith Bank'   },
          { label: 'Account Number',  key: 'account_number',  placeholder: '1234567890'    },
          { label: 'Account Name',    key: 'account_name',    placeholder: 'LUME Arena'    },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={lbl}>{f.label}</label>
            <input
              value={(bank as any)[f.key]}
              onChange={e => setBank(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={inp}
              onFocus={e => e.target.style.borderColor = '#BEFF00'}
              onBlur={e  => e.target.style.borderColor = '#1A1A1A'}
            />
          </div>
        ))}

        <button onClick={saveBank} disabled={saving}
          style={{ background: saving ? '#111' : '#BEFF00', color: saving ? '#333' : '#080808', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 13, fontWeight: 900, fontFamily: "'Arial Black',Arial", cursor: saving ? 'wait' : 'pointer', letterSpacing: 1, transition: 'all .2s' }}>
          {saving ? 'SAVING…' : saved ? '✓ SAVED' : 'SAVE ACCOUNT'}
        </button>
      </div>

      <div style={{ background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 14, padding: '20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#BEFF00', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>WhatsApp Group Links</div>
        <p style={{ fontSize: 12, color: '#444', marginBottom: 16, lineHeight: 1.6 }}>Paste the WhatsApp invite link for each batch. Players in that batch will be notified instantly.</p>

        {batches.length === 0 ? (
          <div style={{ color: '#333', fontSize: 13 }}>No batches created yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {batches.map(batch => (
              <div key={batch.id} style={{ background: '#080808', border: '0.5px solid #111', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 14, fontWeight: 900, color: '#fff' }}>Batch {batch.label}</span>
                  <span style={{ fontSize: 10, color: batch.game === 'FC26' ? '#fff' : '#E24B4A', letterSpacing: 2, opacity: .6 }}>{batch.game === 'FC26' ? 'FC26' : 'MK'}</span>
                  <span style={{ fontSize: 10, color: '#333' }}>Week {batch.week_number}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={links[batch.id] ?? ''}
                    onChange={e => setLinks(prev => ({ ...prev, [batch.id]: e.target.value }))}
                    placeholder="https://chat.whatsapp.com/..."
                    style={{ ...inp, flex: 1, marginBottom: 0, fontSize: 13 }}
                    onFocus={e => e.target.style.borderColor = '#BEFF00'}
                    onBlur={e  => e.target.style.borderColor = '#1A1A1A'}
                  />
                  <button
                    onClick={() => saveLink(batch.id)}
                    disabled={savingLink === batch.id || !links[batch.id]}
                    style={{
                      background:   sentBatches[batch.id] ? '#003E31' : '#003E31',
                      border:       `0.5px solid ${sentBatches[batch.id] ? '#BEFF00' : '#BEFF00'}`,
                      color:        '#BEFF00',
                      borderRadius: 8,
                      padding:      '0 16px',
                      fontSize:     12,
                      fontWeight:   700,
                      cursor:       savingLink === batch.id || !links[batch.id] ? 'not-allowed' : 'pointer',
                      flexShrink:   0,
                      whiteSpace:   'nowrap',
                      minHeight:    42,
                      opacity:      !links[batch.id] ? .4 : 1,
                      transition:   'all .2s'
                    }}>
                    {savingLink === batch.id ? 'Sending…' : sentBatches[batch.id] ? '✓ Sent' : 'Send'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 7 }
const inp: React.CSSProperties = { width: '100%', background: '#0C0C0C', border: '1px solid #1A1A1A', borderRadius: 9, padding: '12px 13px', fontSize: 15, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s', marginBottom: 0 }
