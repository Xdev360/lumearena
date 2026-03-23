'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const EMOJIS = ['🎮','⚽','🥊','🏆','👾','🦁','🐯','🔥','💀','⚡','🎯','👑']
const BG     = ['#003E31','#1a0000','#0a0a2a','#1a0a00','#001a1a','#1a001a']
const RING   = ['#BEFF00','#E24B4A','#7B7BFF','#EF9F27','#00FFCC','#FF79C6']

function parseCfg(url: string | null) {
  if (!url) return null
  try { return JSON.parse(url) } catch { return null }
}

function AvatarPreview({ url, nick, size = 80 }: { url: string; nick: string; size?: number }) {
  const cfg = parseCfg(url)
  if (cfg?.type === 'emoji') {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: BG[cfg.color ?? 0], border: `3px solid ${RING[cfg.color ?? 0]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45, flexShrink: 0 }}>
        {cfg.emoji}
      </div>
    )
  }
  if (url?.startsWith('http')) {
    return <img src={url} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid #BEFF00' }}/>
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#003E31', border: '3px solid #BEFF00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 900, color: '#BEFF00', fontFamily: "'Arial Black',Arial", flexShrink: 0 }}>
      {nick.slice(0,2).toUpperCase()}
    </div>
  )
}

export default function ProfileClient({ player }: { player: any }) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // Parse existing avatar
  const existingCfg = parseCfg(player.avatar_url)
  const isUpload    = player.avatar_url?.startsWith('http')

  // Avatar state
  const [avatarMode, setAvatarMode] = useState<'emoji'|'upload'>(isUpload ? 'upload' : 'emoji')
  const [emoji, setEmoji]           = useState(existingCfg?.emoji ?? EMOJIS[0])
  const [colorIdx, setColorIdx]     = useState(existingCfg?.color ?? 0)
  const [uploadedUrl, setUploadedUrl] = useState<string>(isUpload ? player.avatar_url : '')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading]   = useState(false)

  // Form state
  const [nickname, setNickname]   = useState(player.nickname ?? '')
  const [whatsapp, setWhatsapp]   = useState(player.whatsapp ?? '')
  const [nickOk, setNickOk]       = useState<null|boolean>(null)
  const [nickMsg, setNickMsg]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  // Current avatar URL for preview
  const currentAvatarUrl = avatarMode === 'upload' && uploadedUrl
    ? uploadedUrl
    : JSON.stringify({ type: 'emoji', emoji, color: colorIdx })

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5MB'); return }

    setUploading(true)
    setUploadFile(file)

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setUploadedUrl(localUrl)
    setAvatarMode('upload')
    setUploading(false)
  }

  async function checkNickname(raw: string) {
    const clean = raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
    setNickname(clean)
    setNickOk(null)
    setNickMsg('')
    if (clean === player.nickname) {
      setNickOk(true)
      setNickMsg('Current nickname')
      return
    }
    if (clean.length < 3) return
    const { data } = await supabase
      .from('players').select('id').eq('nickname', clean).maybeSingle()
    if (data) { setNickOk(false); setNickMsg('Already taken') }
    else       { setNickOk(true);  setNickMsg('Available') }
  }

  async function save() {
    if (nickname.length < 3) { setError('Nickname must be at least 3 characters'); return }
    if (nickOk === false)    { setError('Choose a different nickname'); return }

    setSaving(true); setError(''); setSaved(false)

    try {
      let finalAvatarUrl = player.avatar_url

      // Upload file to Supabase Storage if new file selected
      if (avatarMode === 'upload' && uploadFile) {
        const ext  = uploadFile.name.split('.').pop()
        const path = `avatars/${player.id}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, uploadFile, { upsert: true })
        if (upErr) throw new Error('Upload failed: ' + upErr.message)
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        finalAvatarUrl = publicUrl
        setUploadedUrl(publicUrl)
      } else if (avatarMode === 'emoji') {
        finalAvatarUrl = JSON.stringify({ type: 'emoji', emoji, color: colorIdx })
      }

      const res = await fetch('/api/auth/setup-profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          avatar_url: finalAvatarUrl,
          whatsapp
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      setSaved(true)
      setTimeout(() => {
        router.refresh()
        router.push('/dashboard')
      }, 1000)

    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const canSave = nickname.length >= 3 && nickOk !== false && !saving

  return (
    <div style={{ minHeight: '100dvh', background: '#080808', color: '#fff', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 400px 200px at 50% -40px,rgba(0,62,49,.35) 0%,transparent 70%)', pointerEvents: 'none' }}/>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,8,8,.95)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #111', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: '#BEFF00', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#003E31', fontFamily: "'Arial Black',Arial" }}>LA</span>
          </div>
          <span style={{ fontFamily: "'Arial Black',Arial", fontSize: 12, letterSpacing: 2 }}>LUME ARENA</span>
        </div>
        <Link href="/dashboard" style={{ fontSize: 12, color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Dashboard
        </Link>
      </nav>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 16px 60px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: '#BEFF00', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Settings</div>
            <h1 style={{ fontFamily: "'Arial Black',Arial", fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>Edit Profile</h1>
          </div>

          {/* ── AVATAR SECTION ── */}
          <div className="form-section">
            <div className="form-section-title">Profile Picture</div>

            {/* Current avatar preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <AvatarPreview url={currentAvatarUrl} nick={nickname || 'LA'} size={68}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  {nickname || 'Your nickname'}
                </div>
                <div style={{ fontSize: 11, color: '#444' }}>
                  {avatarMode === 'upload' && uploadedUrl ? 'Custom photo' : `Emoji avatar`}
                </div>
              </div>
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', background: '#080808', borderRadius: 10, padding: 3, marginBottom: 16, gap: 3 }}>
              <button onClick={() => setAvatarMode('emoji')}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: avatarMode === 'emoji' ? '#003E31' : 'transparent', color: avatarMode === 'emoji' ? '#BEFF00' : '#444', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
                Choose Avatar
              </button>
              <button onClick={() => fileRef.current?.click()}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: avatarMode === 'upload' ? '#003E31' : 'transparent', color: avatarMode === 'upload' ? '#BEFF00' : '#444', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }}/>
            </div>

            {/* Emoji picker */}
            <AnimatePresence>
              {avatarMode === 'emoji' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                    {EMOJIS.map(em => (
                      <button key={em} onClick={() => setEmoji(em)}
                        style={{ width: 44, height: 44, borderRadius: 10, background: emoji === em ? BG[colorIdx] : '#080808', border: `1.5px solid ${emoji === em ? RING[colorIdx] : '#1A1A1A'}`, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>Color</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {BG.map((c, i) => (
                        <button key={i} onClick={() => setColorIdx(i)}
                          style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `2.5px solid ${colorIdx === i ? RING[i] : 'transparent'}`, cursor: 'pointer', transition: 'all .15s' }}/>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload confirmation */}
            {avatarMode === 'upload' && uploadedUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#003E31', border: '0.5px solid #005544', borderRadius: 8, padding: '8px 12px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BEFF00" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 12, color: '#BEFF00' }}>Photo selected — will upload when you save</span>
              </div>
            )}
          </div>

          {/* ── ACCOUNT DETAILS ── */}
          <div className="form-section">
            <div className="form-section-title">Account Details</div>

            {/* Nickname */}
            <div className="input-wrap">
              <label className="input-label">
                Nickname
                <span style={{ color: '#BEFF00', fontSize: 10, letterSpacing: 0, textTransform: 'none', fontWeight: 400, marginLeft: 6 }}>
                  used in matches
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 15, pointerEvents: 'none' }}>@</span>
                <input
                  type="text"
                  className="input"
                  value={nickname}
                  onChange={e => { checkNickname(e.target.value); setError('') }}
                  maxLength={20}
                  placeholder="yourname"
                  style={{
                    paddingLeft: 30,
                    borderColor: nickOk === false ? 'var(--danger)' : nickOk === true && nickname !== player.nickname ? 'var(--lemon)' : 'var(--border)'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--lemon)'}
                  onBlur={e  => e.target.style.borderColor = nickOk === false ? 'var(--danger)' : 'var(--border)'}
                />
              </div>
              {nickname.length >= 3 && nickMsg && (
                <p style={{ fontSize: 11, color: nickOk === false ? '#E24B4A' : nickOk === true ? '#BEFF00' : '#555', marginTop: 5 }}>
                  {nickMsg}
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="input-wrap">
              <label className="input-label">WhatsApp Number</label>
              <input
                type="tel"
                className="input"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="08012345678"
                onFocus={e => e.target.style.borderColor = 'var(--lemon)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Email — read only */}
            <div className="input-wrap">
              <label className="input-label">
                Email
                <span style={{ color: '#333', fontSize: 10, letterSpacing: 0, textTransform: 'none', fontWeight: 400, marginLeft: 6 }}>
                  cannot change
                </span>
              </label>
              <div className="input" style={{ color: 'var(--dim)', background: 'var(--black)', cursor: 'not-allowed', borderColor: '#111' }}>
                {player.email || '—'}
              </div>
            </div>
          </div>

          {/* ── POINTS CARD (read only) ── */}
          <div style={{ background: 'linear-gradient(135deg,#003E31 0%,#001a14 100%)', border: '0.5px solid #005544', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, color: '#BEFF00', opacity: .6, textTransform: 'uppercase', marginBottom: 6 }}>Points balance</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 36, fontWeight: 900, color: '#BEFF00', letterSpacing: -2, lineHeight: 1 }}>
                {player.total_points ?? 0}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { l: 'W', v: player.total_wins    ?? 0, c: '#BEFF00' },
                  { l: 'L', v: player.total_losses  ?? 0, c: '#fff'    },
                  { l: 'M', v: player.total_matches ?? 0, c: '#fff'    },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Arial Black',Arial", fontSize: 18, fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 8, color: '#BEFF00', opacity: .4, letterSpacing: 2, textTransform: 'uppercase' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: '#1a0000', border: '0.5px solid #330000', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#E24B4A', marginBottom: 14 }}>
              {error}
            </motion.div>
          )}

          {/* Save button */}
          <button onClick={save} disabled={!canSave}
            className={`btn btn-full ${canSave || saved ? 'btn-primary' : ''}`}
            style={{
              minHeight: 52,
              background: saved ? 'var(--green)' : canSave ? undefined : '#111',
              color: saved ? 'var(--lemon)' : canSave ? undefined : 'var(--dim)',
              border: saved ? '0.5px solid var(--lemon)' : 'none',
              cursor: canSave ? 'pointer' : 'not-allowed'
            }}>
            {saving ? 'SAVING…' : saved ? '✓ PROFILE UPDATED' : 'SAVE CHANGES →'}
          </button>

        </motion.div>
      </div>
    </div>
  )
}

