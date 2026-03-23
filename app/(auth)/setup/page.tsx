'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EMOJIS = ['🎮','⚽','🥊','🏆','👾','🦁','🐯','🔥','💀','⚡','🎯','👑']
const COLORS  = [
  { bg: '#003E31', fg: '#BEFF00' },
  { bg: '#1a0000', fg: '#E24B4A' },
  { bg: '#0a0a1a', fg: '#7B7BFF' },
  { bg: '#1a0a00', fg: '#EF9F27' },
  { bg: '#001a1a', fg: '#00FFCC' },
  { bg: '#1a001a', fg: '#FF79C6' },
]

export default function SetupPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loadingPlayer, setLoadingPlayer] = useState(true)
  const [fullName, setFullName]     = useState('')
  const [nickname, setNickname]     = useState('')
  const [nickErr, setNickErr]       = useState('')
  const [emoji, setEmoji]           = useState(EMOJIS[0])
  const [colorIdx, setColorIdx]     = useState(0)
  const [useUpload, setUseUpload]   = useState(false)
  const [preview, setPreview]       = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ player }) => {
        if (player) {
          if (player.full_name) setFullName(player.full_name)
          if (player.avatar_url?.startsWith('http')) {
            setPreview(player.avatar_url)
            setUseUpload(true)
          }
        }
        setLoadingPlayer(false)
      })
      .catch(() => setLoadingPlayer(false))
  }, [])

  async function checkNick(val: string) {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
    setNickname(clean)
    if (clean.length < 3) { setNickErr(''); return }
    const res  = await fetch(`/api/auth/check-nickname?n=${clean}`)
    const data = await res.json()
    setNickErr(data.taken ? 'Already taken — try another' : '')
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setUploadFile(f)
    setPreview(URL.createObjectURL(f))
    setUseUpload(true)
  }

  async function handleSubmit() {
    if (!fullName.trim()) { setError('Enter your name'); return }
    if (nickname.length < 3) { setError('Nickname needs at least 3 characters'); return }
    if (nickErr) { setError(nickErr); return }

    setLoading(true); setError('')

    try {
      let avatarUrl = ''

      if (useUpload && uploadFile) {
        setUploading(true)
        const fd = new FormData()
        fd.append('file', uploadFile)
        const up   = await fetch('/api/auth/upload-avatar', { method: 'POST', body: fd })
        const upD  = await up.json()
        if (!up.ok) { setError(upD.error); setLoading(false); setUploading(false); return }
        avatarUrl = upD.url
        setUploading(false)
      } else {
        avatarUrl = JSON.stringify({ type: 'emoji', emoji, color: colorIdx })
      }

      const res  = await fetch('/api/auth/setup-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), nickname, avatar_url: avatarUrl })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/dashboard')
    } catch { setError('Something went wrong. Try again.') }
    finally   { setLoading(false) }
  }

  const col = COLORS[colorIdx]
  const canSubmit = fullName.trim() && nickname.length >= 3 && !nickErr

  return (
    <div style={{ minHeight: '100dvh', background: '#080808', color: '#fff', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column' }}>

      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 500px 300px at 50% -60px,rgba(0,62,49,.4) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      {/* Nav */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 30, height: 30, background: '#BEFF00', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
        </div>
        <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 13, letterSpacing: 2 }}>LUME ARENA</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '8px 20px 40px', maxWidth: 480, width: '100%', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: '#BEFF00', textTransform: 'uppercase', marginBottom: 8 }}>One last step</p>
            <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 'clamp(22px,6vw,30px)', fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>Set up your profile</h1>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>Your nickname is how other players know you in every match.</p>
          </div>

          {/* Avatar preview + picker */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 12 }}>Profile picture</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              {/* Preview */}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: useUpload ? '#111' : col.bg, border: useUpload ? '2px solid #BEFF00' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: 32 }}>
                {useUpload && preview
                  ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar"/>
                  : emoji
                }
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => fileRef.current?.click()}
                  style={{ width: '100%', background: '#0C0C0C', border: '0.5px solid #1A1A1A', borderRadius: 10, padding: '11px', fontSize: 13, color: '#666', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                  Upload photo
                </button>
                <button onClick={() => { setUseUpload(false); setPreview(null); setUploadFile(null) }}
                  style={{ width: '100%', background: !useUpload ? '#003E31' : 'transparent', border: `0.5px solid ${!useUpload ? '#BEFF00' : '#1A1A1A'}`, borderRadius: 10, padding: '11px', fontSize: 13, color: !useUpload ? '#BEFF00' : '#444', cursor: 'pointer', transition: 'all .2s' }}>
                  Choose avatar
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>
              </div>
            </div>

            {/* Emoji grid */}
            <AnimatePresence>
              {!useUpload && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {EMOJIS.map(em => (
                      <button key={em} onClick={() => setEmoji(em)}
                        style={{ width: 46, height: 46, borderRadius: 10, background: emoji === em ? col.bg : '#0C0C0C', border: `1.5px solid ${emoji === em ? col.fg : '#1A1A1A'}`, fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                  {/* Color picker */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>Color</span>
                    {COLORS.map((c, i) => (
                      <button key={i} onClick={() => setColorIdx(i)}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: c.bg, border: `2.5px solid ${colorIdx === i ? '#BEFF00' : 'transparent'}`, cursor: 'pointer', transition: 'all .15s' }}/>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Full name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>Full name</label>
            <input type="text" placeholder="Emeka Okafor" value={fullName}
              onChange={e => { setFullName(e.target.value); setError('') }}
              style={{ width: '100%', background: '#080808', border: '1px solid #1A1A1A', borderRadius: 10, padding: '14px', fontSize: 16, color: '#fff', outline: 'none', fontFamily: 'inherit', transition: 'border-color .2s' }}
              onFocus={e => e.target.style.borderColor = '#BEFF00'}
              onBlur={e  => e.target.style.borderColor = '#1A1A1A'}
            />
          </div>

          {/* Nickname */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>
              Nickname <span style={{ color: '#BEFF00', textTransform: 'none', letterSpacing: 0 }}>— shown in matchups</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#333', pointerEvents: 'none' }}>@</span>
              <input type="text" placeholder="lumekiller99" value={nickname}
                onChange={e => { checkNick(e.target.value); setError('') }}
                style={{ width: '100%', background: '#080808', border: `1px solid ${nickErr ? '#E24B4A' : '#1A1A1A'}`, borderRadius: 10, padding: '14px 14px 14px 34px', fontSize: 16, color: '#fff', outline: 'none', fontFamily: 'inherit', letterSpacing: 1, transition: 'border-color .2s' }}
                onFocus={e => e.target.style.borderColor = nickErr ? '#E24B4A' : '#BEFF00'}
                onBlur={e  => e.target.style.borderColor = nickErr ? '#E24B4A' : '#1A1A1A'}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {nickErr
                ? <span style={{ fontSize: 11, color: '#E24B4A' }}>{nickErr}</span>
                : nickname.length >= 3
                  ? <span style={{ fontSize: 11, color: '#BEFF00' }}>✓ Available</span>
                  : <span style={{ fontSize: 11, color: '#333' }}>Letters, numbers, underscores only</span>
              }
              <span style={{ fontSize: 11, color: '#333' }}>{nickname.length}/20</span>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: '#1a0000', border: '0.5px solid #330000', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E24B4A', marginBottom: 16 }}>
              {error}
            </motion.div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit || loading}
            style={{ width: '100%', minHeight: 52, background: canSubmit && !loading ? '#BEFF00' : '#111', color: canSubmit && !loading ? '#080808' : '#333', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 900, fontFamily: "'Arial Black',Arial", letterSpacing: 1, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed', transition: 'all .2s' }}>
            {uploading ? 'UPLOADING PHOTO…' : loading ? 'SETTING UP…' : 'ENTER THE ARENA →'}
          </button>

        </motion.div>
      </div>
    </div>
  )
}
