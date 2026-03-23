import { redirect } from 'next/navigation'
import { getPlayerFromCookie } from '@/lib/auth'
import { getPlayerDashboardData } from '@/lib/player'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const player = await getPlayerFromCookie()
  if (!player) redirect('/login')

  const data = await getPlayerDashboardData(player.id)

  return <DashboardClient data={data} playerId={player.id} />
}
