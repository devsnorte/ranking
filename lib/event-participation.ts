import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function recordEventParticipation(eventId: string, userId: string) {
  try {
    // Check if user has already participated in this event
    const { data: existingParticipation, error: checkError } = await supabaseAdmin
      .from('user_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking event participation:', checkError)
      throw checkError
    }

    // If user hasn't participated yet, record their participation
    if (!existingParticipation) {
      const { error: insertError } = await supabaseAdmin
        .from('user_events')
        .insert([
          {
            event_id: eventId,
            user_id: userId,
            checked_in_at: new Date().toISOString()
          }
        ])

      if (insertError) {
        console.error('Error recording event participation:', insertError)
        throw insertError
      }

      return { success: true, message: 'Event participation recorded successfully' }
    }

    return { success: false, message: 'User has already participated in this event' }
  } catch (error) {
    console.error('Error in recordEventParticipation:', error)
    throw error
  }
}
