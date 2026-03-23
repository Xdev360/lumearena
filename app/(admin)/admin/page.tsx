import { createClient } from '@supabase/supabase-js'
import OverviewClient from './OverviewClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function AdminOverview() {
  const [
    { data: payments },
    { data: batches },
    { data: week },
    { data: players },
  ] = await Promise.all([
    supabase.from('payments').select('status, amount').order('created_at', { ascending: false }),
    supabase.from('batches').select('*').order('created_at', { ascending: false }),
    supabase.from('weeks').select('*').order('week_number', { ascending: false }).limit(1).single(),
    supabase.from('players').select('id', { count: 'exact' }),
  ])

  const confirmed     = payments?.filter(p => p.status === 'confirmed') ?? []
  const pending       = payments?.filter(p => p.status === 'pending_review' || p.status === 'pending') ?? []
  const totalIn       = confirmed.reduce((s, p) => s + p.amount, 0)
  const totalPrizes   = (batches?.filter(b => b.status === 'completed').length ?? 0) * 130000
  const profit        = totalIn - totalPrizes

  return (
    <OverviewClient
      stats={{ totalIn, profit, pending: pending.length, players: players?.length ?? 0 }}
      batches={batches ?? []}
      week={week}
    />
  )
}

