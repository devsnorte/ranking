import { createServerClient } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react"
import EventCheckInForm from "@/components/event-check-in-form"

export default async function EventsPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch events from the database
  const { data: events } = await supabase.from("events").select("*").order("date", { ascending: true })

  // Fetch user's checked-in events
  const { data: userEvents } = await supabase.from("user_events").select("event_id").eq("user_id", user?.id)

  const checkedInEventIds = userEvents?.map((ue) => ue.event_id) || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Community Events</h2>
        <p className="text-muted-foreground">Check in to events and earn points for your participation</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events && events.length > 0 ? (
          events.map((event) => {
            const isCheckedIn = checkedInEventIds.includes(event.id)
            const eventDate = new Date(event.date)
            const isPast = eventDate < new Date()

            return (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                      <span className="text-sm">
                        {eventDate.toLocaleDateString()} at {event.time}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="mr-2 h-4 w-4 opacity-70" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="mr-2 h-4 w-4 opacity-70" />
                      <span className="text-sm">{event.points} points</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {isCheckedIn ? (
                    <Button disabled className="w-full">
                      Already Checked In
                    </Button>
                  ) : isPast ? (
                    <Button disabled variant="outline" className="w-full">
                      Event Ended
                    </Button>
                  ) : (
                    <EventCheckInForm eventId={event.id} userId={user?.id || ""} />
                  )}
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium">No events available</h3>
            <p className="text-muted-foreground">Check back later for upcoming events</p>
          </div>
        )}
      </div>
    </div>
  )
}

