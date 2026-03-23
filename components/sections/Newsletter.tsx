'use client'

import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email?.includes('@')) return
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setEmail('')
        setMessage('You\'re subscribed. We\'ll notify you when the next week opens.')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Try again.')
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: 5, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Stay in the loop</div>
      <h3 style={{ fontFamily: "'Arial Black',Arial", fontSize: 24, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>Get notified when registrations open</h3>
      <p style={{ fontSize: 14, color: '#444', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
        Enter your email to get a heads-up before each week opens.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 400, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          disabled={status === 'loading'}
          style={{
            flex: 1, minWidth: 200, background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 10,
            padding: '14px 18px', fontSize: 15, color: '#fff', outline: 'none', fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email?.includes('@')}
          style={{
            background: status === 'loading' || !email?.includes('@') ? '#111' : '#BEFF00',
            color: status === 'loading' || !email?.includes('@') ? '#333' : '#080808',
            border: 'none', borderRadius: 10, padding: '14px 24px', fontSize: 14, fontWeight: 900,
            fontFamily: "'Arial Black',Arial", cursor: status === 'loading' ? 'wait' : 'pointer', letterSpacing: 1
          }}
        >
          {status === 'loading' ? '…' : 'Subscribe'}
        </button>
      </form>
      {message && (
        <p style={{ fontSize: 13, color: status === 'success' ? '#BEFF00' : '#E24B4A', marginTop: 12 }}>
          {message}
        </p>
      )}
    </div>
  )
}
