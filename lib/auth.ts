import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** Normalize Nigerian WhatsApp to canonical form: 2348012345678 */
export function normalizeWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length >= 13) return digits
  if (digits.startsWith('0') && digits.length >= 11) return '234' + digits.slice(1)
  if (digits.length >= 10) return '234' + digits.slice(-10)
  return digits
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

export async function createOTP(whatsapp: string): Promise<string> {
  const normalized = normalizeWhatsApp(whatsapp)
  const otp        = generateOTP()
  const expires    = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

  const { error } = await supabase.from('players').upsert(
    { whatsapp: normalized, otp_code: otp, otp_expires_at: expires.toISOString() },
    { onConflict: 'whatsapp' }
  )

  if (error) throw new Error(error.message || 'Failed to save OTP')
  return otp
}

export async function verifyOTP(
  whatsapp: string,
  otp: string
): Promise<{ success: boolean; playerId?: string; onboarded?: boolean; error?: string }> {
  const normalized = normalizeWhatsApp(whatsapp)
  const { data: player } = await supabase
    .from('players')
    .select('id, otp_code, otp_expires_at, is_verified, onboarded')
    .eq('whatsapp', normalized)
    .single()

  if (!player)               return { success: false, error: 'Phone number not found' }
  if (player.otp_code !== otp) return { success: false, error: 'Incorrect code' }
  if (new Date(player.otp_expires_at) < new Date())
                              return { success: false, error: 'Code expired. Request a new one.' }

  // Mark verified
  await supabase.from('players')
    .update({ is_verified: true, otp_code: null })
    .eq('id', player.id)

  return { success: true, playerId: player.id, onboarded: !!player.onboarded }
}

export async function createSession(playerId: string): Promise<string> {
  const token   = generateToken()
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await supabase.from('sessions').insert({
    player_id:  playerId,
    token,
    expires_at: expires.toISOString()
  })

  return token
}

export async function getPlayerFromCookie(): Promise<{
  id: string; full_name: string | null; whatsapp: string
} | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('lume_session')?.value
  if (!token) return null

  const { data: session } = await supabase
    .from('sessions')
    .select('player_id, expires_at')
    .eq('token', token)
    .single()

  if (!session) return null
  if (new Date(session.expires_at) < new Date()) return null

  const { data: player } = await supabase
    .from('players')
    .select('id, full_name, whatsapp')
    .eq('id', session.player_id)
    .single()

  return player ?? null
}

export async function deleteSession(token: string) {
  await supabase.from('sessions').delete().eq('token', token)
}

