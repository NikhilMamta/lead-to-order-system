'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, isSameDay } from 'date-fns'
import { CalendarIcon, Clock, Phone, ArrowRight } from 'lucide-react'
import { leadStorage, followUpStorage } from '@/lib/storage'
import { LeadDetails, FollowUpHistory } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<{ date: Date; type: string; data: any }[]>([])
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([])

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (date) {
      const dayEvents = events.filter((event) => isSameDay(event.date, date))
      setSelectedDateEvents(dayEvents)
    }
  }, [date, events])

  const loadEvents = () => {
    const leads = leadStorage.getAll()
    const followUps = followUpStorage.getAll()
    const allEvents: { date: Date; type: string; data: any }[] = []

    // Add lead follow-ups
    leads.forEach((lead) => {
      if (lead.nextFollowupDate) {
        allEvents.push({
          date: new Date(lead.nextFollowupDate),
          type: 'lead-followup',
          data: lead,
        })
      }
      if (lead.planned) {
        allEvents.push({
          date: new Date(lead.planned),
          type: 'lead-planned',
          data: lead,
        })
      }
    })

    // Add recorded follow-ups (past events)
    followUps.forEach((fu) => {
      allEvents.push({
        date: new Date(fu.timestamp),
        type: 'interaction',
        data: fu,
      })
    })

    setEvents(allEvents)
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'lead-followup':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'lead-planned':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'interaction':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEventTitle = (event: any) => {
    switch (event.type) {
      case 'lead-followup':
        return `Follow-up: ${event.data.companyName}`
      case 'lead-planned':
        return `Planned: ${event.data.companyName}`
      case 'interaction':
        return `Call: ${event.data.leadNo}`
      default:
        return 'Event'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
        <p className="text-muted-foreground">View your schedule and upcoming follow-ups</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                event: events.map((e) => e.date),
              }}
              modifiersStyles={{
                event: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' },
              }}
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="size-3 rounded-full bg-orange-500" />
                <span>Scheduled Follow-ups</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="size-3 rounded-full bg-blue-500" />
                <span>Planned Activities</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="size-3 rounded-full bg-green-500" />
                <span>Past Interactions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full min-h-[500px]">
          <CardHeader>
            <CardTitle>
              {date ? format(date, 'EEEE, MMMM do, yyyy') : 'Select a date'}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length} event(s) scheduled for this day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <CalendarIcon className="size-12 mb-4 opacity-20" />
                <p>No events scheduled for this day</p>
                <Button 
                  variant="link" 
                  onClick={() => router.push('/lead-details')}
                  className="mt-2"
                >
                  Schedule a follow-up
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event, index) => (
                  <div
                    key={index}
                    className={`flex flex-col p-4 rounded-lg border ${getEventColor(event.type)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{getEventTitle(event)}</h4>
                      <Badge variant="outline" className="bg-white/50">
                        {event.type === 'interaction' ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>
                    
                    {event.type === 'lead-followup' && (
                      <div className="text-sm space-y-1">
                        <p><strong>Contact:</strong> {event.data.personName} ({event.data.phoneNumber})</p>
                        <p><strong>Last Note:</strong> {event.data.whatDidCustomerSay}</p>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="mt-2 w-full sm:w-auto"
                          onClick={() => router.push('/call-tracker')}
                        >
                          <Phone className="size-3 mr-2" />
                          Call Now
                        </Button>
                      </div>
                    )}

                    {event.type === 'lead-planned' && (
                      <div className="text-sm space-y-1">
                        <p><strong>Location:</strong> {event.data.location}</p>
                        <p><strong>Remarks:</strong> {event.data.remarks}</p>
                      </div>
                    )}

                    {event.type === 'interaction' && (
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-xs opacity-70 mb-1">
                          <Clock className="size-3 mr-1" />
                          {format(new Date(event.data.timestamp), 'h:mm a')}
                        </div>
                        <p>{event.data.whatDidCustomerSay}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
