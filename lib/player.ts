import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getPlayerDashboardData(playerId: string) {
  const [
    { data: player },
    { data: activeReg },
    { data: history },
    { data: notifications },
    { data: week }
  ] = await Promise.all([
    supabase
      .from('players')
      .select('id, full_name, nickname, whatsapp, created_at, total_points, total_wins, total_losses, total_matches')
      .eq('id', playerId)
      .single(),

    supabase
      .from('registrations')
      .select(`
        id, game, slot_number, payment_status, week_number, created_at,
        batch:batches(id, label, game, status, slots_filled, max_slots, match_date, match_venue, whatsapp_link),
        payment:payments(status, reference, amount, created_at)
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('registrations')
      .select(`
        id, game, slot_number, payment_status, week_number, created_at,
        batch:batches(id, label, game, status, slots_filled, max_slots, match_date, match_venue, whatsapp_link)
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false }),

    supabase
      .from('notifications')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('weeks')
      .select('week_number, status')
      .order('week_number', { ascending: false })
      .limit(1)
      .single()
  ])

  const registrations = [
    activeReg,
    ...(history ?? []).filter((h: { id?: string }) => h?.id !== activeReg?.id)
  ].filter(Boolean)

  return { player, activeReg, history: history ?? [], registrations, notifications: notifications ?? [], week }
}

export async function getPlayerProfileData(playerId: string) {
  const { data: player } = await supabase
    .from('players')
    .select('id, email, full_name, nickname, avatar_url, whatsapp, total_points, total_wins, total_losses, total_matches')
    .eq('id', playerId)
    .single()
  return player
}

