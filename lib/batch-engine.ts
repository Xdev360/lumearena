import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const LETTERS = ['A','B','C','D','E','F','G','H','I','J']

export async function assignPlayerToBatch(
  game: string,
  weekNumber: number,
  registrationId: string,
  playerId: string
) {
  // 1. Find current open batch for this game + week
  let { data: openBatch } = await supabase
    .from('batches').select('*')
    .eq('game', game)
    .eq('week_number', weekNumber)
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // 2. No open batch exists — create Batch A for this week
  // Label format: A1, B1, C1 for week 1 | A2, B2, C2 for week 2
  if (!openBatch) {
    const label = `A${weekNumber}`
    const { data: newBatch } = await supabase
      .from('batches')
      .insert({ game, week_number: weekNumber, label, status: 'open', slots_filled: 0, max_slots: 8 })
      .select().single()
    openBatch = newBatch
  }

  if (!openBatch) return null

  const slotNumber = openBatch.slots_filled + 1
  const isFull     = slotNumber >= openBatch.max_slots

  // 3. Assign player to this batch + slot
  await supabase.from('registrations').update({
    batch_id:       openBatch.id,
    slot_number:    slotNumber,
    payment_status: 'confirmed'
  }).eq('id', registrationId)

  // 4. Update batch slot count + status
  await supabase.from('batches').update({
    slots_filled: slotNumber,
    status:       isFull ? 'full' : 'open'
  }).eq('id', openBatch.id)

  // 5. If batch just filled — auto-open next batch
  if (isFull) {
    // Find the letter of this batch e.g. "B1" → letter is "B" → next is "C"
    const currentLetter  = openBatch.label.replace(/[0-9]/g, '')
    const currentIdx     = LETTERS.indexOf(currentLetter)
    const nextLetter     = LETTERS[currentIdx + 1]

    if (nextLetter) {
      const nextLabel = `${nextLetter}${weekNumber}`
      await supabase.from('batches').insert({
        game,
        week_number:  weekNumber,
        label:        nextLabel,
        status:       'open',
        slots_filled: 0,
        max_slots:    8
      })
    }

    // Notify all confirmed players in this now-full batch
    const { data: batchPlayers } = await supabase
      .from('registrations')
      .select('player_id')
      .eq('batch_id', openBatch.id)
      .eq('payment_status', 'confirmed')

    if (batchPlayers?.length) {
      const notifications = batchPlayers.map((p: any) => ({
        player_id: p.player_id,
        title:     `Batch ${openBatch.label} is full`,
        body:      openBatch.whatsapp_link
          ? `Your batch is complete. Join your WhatsApp group for updates.`
          : `Your batch is complete. Match date will be announced soon.`,
        type: 'batch_full'
      }))
      await supabase.from('notifications').insert(notifications)
    }
  }

  // 6. Notify this specific player of their assignment
  await supabase.from('notifications').insert({
    player_id: playerId,
    title:     `You're in Batch ${openBatch.label}`,
    body:      `Payment confirmed. You are Slot ${slotNumber} in Batch ${openBatch.label} for ${game === 'FC26' ? 'EA FC 26' : 'Mortal Kombat'}.${openBatch.whatsapp_link ? ' Join your WhatsApp group now.' : ' Watch for your match date.'}`,
    type:      'payment_confirmed'
  })

  return {
    batchLabel:    openBatch.label,
    slot:          slotNumber,
    isFull,
    whatsappLink:  openBatch.whatsapp_link ?? null
  }
}
