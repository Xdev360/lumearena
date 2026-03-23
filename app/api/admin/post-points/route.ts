import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { entries } = await req.json()
  // entries: [{ player_id, nickname, match_type, goals_scored, game, week_number, batch_id }]

  for (const e of entries) {
    const isWin       = e.match_type === 'win'
    const points      = isWin ? 3 + (e.goals_scored ?? 0) : 1

    // Log the points entry
    await supabase.from('points_log').insert({
      player_id:     e.player_id,
      match_type:    e.match_type,
      goals_scored:  e.goals_scored ?? 0,
      points_earned: points,
      game:          e.game,
      week_number:   e.week_number,
      batch_id:      e.batch_id
    })

    // Get current totals
    const { data: player } = await supabase
      .from('players')
      .select('total_points, total_wins, total_losses, total_matches, total_prizes')
      .eq('id', e.player_id).single()

    if (player) {
      await supabase.from('players').update({
        total_points:  (player.total_points  ?? 0) + points,
        total_wins:    (player.total_wins    ?? 0) + (isWin ? 1 : 0),
        total_losses:  (player.total_losses  ?? 0) + (isWin ? 0 : 1),
        total_matches: (player.total_matches ?? 0) + 1,
        total_prizes:  (player.total_prizes  ?? 0) + (e.prize ?? 0),
      }).eq('id', e.player_id)
    }

    // Notify player
    await supabase.from('notifications').insert({
      player_id: e.player_id,
      title: isWin ? `+${points} points — Victory!` : `+${points} point — Match complete`,
      body:  isWin
        ? `You won your match. ${e.goals_scored} goal${e.goals_scored !== 1 ? 's' : ''} scored. ${points} points added to your balance.`
        : `Match recorded. 1 point added to your balance.`,
      type: 'points'
    })
  }

  return NextResponse.json({ success: true })
}
