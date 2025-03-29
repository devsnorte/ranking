"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase-browser"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface EventCheckInFormProps {
  eventId: string
  userId: string
}

export default function EventCheckInForm({ eventId, userId }: EventCheckInFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleCheckIn = async () => {
    if (!userId) return

    setIsLoading(true)

    try {
      // Check if already checked in
      const { data: existing } = await supabase
        .from("user_events")
        .select()
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .single()

      if (existing) {
        toast({
          title: "Already checked in",
          description: "You have already checked in to this event",
        })
        return
      }

      // Add check-in record
      const { error } = await supabase.from("user_events").insert({
        user_id: userId,
        event_id: eventId,
        checked_in_at: new Date().toISOString(),
      })

      if (error) throw error

      // Get event points
      const { data: event } = await supabase.from("events").select("points, name").eq("id", eventId).single()

      // Add activity record
      await supabase.from("activities").insert({
        user_id: userId,
        type: "event",
        title: `Checked in to ${event?.name}`,
        description: `Earned ${event?.points} points for attending this event`,
        points: event?.points || 0,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Check-in successful!",
        description: `You earned ${event?.points} points for checking in to this event.`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error checking in",
        description: "There was a problem checking in to this event.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckIn} disabled={isLoading} className="w-full">
      {isLoading ? "Checking in..." : "Check In"}
    </Button>
  )
}

