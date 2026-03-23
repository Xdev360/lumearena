import { redirect } from 'next/navigation'
import { getPlayerFromCookie } from '@/lib/auth'
import { getPlayerProfileData } from '@/lib/player'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const player = await getPlayerFromCookie()
  if (!player) redirect('/login')

  const profilePlayer = await getPlayerProfileData(player.id)
  if (!profilePlayer) redirect('/dashboard')

  return <ProfileClient player={profilePlayer} />
}
