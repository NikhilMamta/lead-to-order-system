'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, MessageSquare, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FollowUpForm } from '@/components/follow-up-form'
import { followUpStorage, leadStorage } from '@/lib/storage'
import { FollowUpHistory, LeadDetails } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export default function CallTrackerPage() {
  const { toast } = useToast()

  const [followUps, setFollowUps] = useState<FollowUpHistory[]>([])
  const [leads, setLeads] = useState<LeadDetails[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeadFilter, setSelectedLeadFilter] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedLeadNo, setSelectedLeadNo] = useState<string | undefined>(undefined)

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec'

  // --------------------------------------------------
  // ⭐ NEW FUNCTION: Fetch Follow-Ups from Google Sheet
  // --------------------------------------------------
  const fetchFollowUpsFromGoogleSheet = async () => {
    try {
      const resp = await fetch(`${SCRIPT_URL}?action=getFollowUps`)
      const json = await resp.json()

      console.log("FOLLOW UPS FROM SHEET:", json)

      if (json.success && Array.isArray(json.data)) {
        const formatted: FollowUpHistory[] = json.data.map((row: any) => ({
          id: crypto.randomUUID(),
          timestamp: new Date(row[0]).toISOString(),
          leadNo: row[1],
          leadStatus: row[2],
          nextFollowupDate: row[3] ? new Date(row[3]).toISOString() : null,
          whatDidCustomerSay: row[4],
        }))

        setFollowUps(
          formatted.sort(
            (a: FollowUpHistory, b: FollowUpHistory) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        )
      }
    } catch (err) {
      console.error('Error loading follow-ups:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    fetchFollowUpsFromGoogleSheet()
    setLeads(leadStorage.getAll())
  }

  // -------------------------------------------------------------------------
  // 🔥 Save Follow-Up Row to Google Sheet (Flw-Up)
  // -------------------------------------------------------------------------
  const saveFollowUpToGoogleSheet = async (data: FollowUpHistory) => {
    const formData = new URLSearchParams()
    formData.append('action', 'insertFollowUp')
    formData.append('sheetName', 'Flw-Up')
    formData.append('leadNo', data.leadNo || '')
    formData.append('leadStatus', data.leadStatus || '')
    formData.append('nextFollowupDate', data.nextFollowupDate || '')
    formData.append('whatDidCustomerSay', data.whatDidCustomerSay || '')

    try {
      const response = await fetch(SCRIPT_URL, { method: 'POST', body: formData })
      const result = await response.json()
      console.log('Follow-up saved:', result)
    } catch (error) {
      console.error('Google Sheet Error:', error)
    }
  }

  const handleAddFollowUp = async (data: Partial<FollowUpHistory>) => {
    const newFollowUp: FollowUpHistory = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    } as FollowUpHistory

    followUpStorage.add(newFollowUp)

    await saveFollowUpToGoogleSheet(newFollowUp)

    if (data.leadNo) {
      const lead = leads.find((l) => l.leadNo === data.leadNo)
      if (lead) {
        leadStorage.update(lead.id, {
          leadStatus: data.leadStatus,
          nextFollowupDate: data.nextFollowupDate,
          whatDidCustomerSay: data.whatDidCustomerSay,
        })
      }
    }

    loadData()

    toast({
      title: 'Success',
      description: 'Follow-up recorded successfully',
    })
  }

  const filteredFollowUps = followUps.filter((fu) => {
    const matchesSearch =
      fu.leadNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fu.whatDidCustomerSay.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLead = selectedLeadFilter === 'all' || fu.leadNo === selectedLeadFilter

    return matchesSearch && matchesLead
  })

  const getLeadName = (leadNo: string) => {
    const lead = leads.find((l) => l.leadNo === leadNo)
    return lead ? lead.companyName : 'Unknown Lead'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
    }
  }

  const openFollowUpFormForLead = (leadNo: string) => {
    setSelectedLeadNo(leadNo)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Call Tracker</h2>
          <p className="text-muted-foreground">Track follow-ups and customer interactions</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUps.length}</div>
            <p className="text-xs text-muted-foreground">Recorded calls & meetings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {leads.filter((l) => l.leadStatus === 'follow-up').length}
            </div>
            <p className="text-xs text-muted-foreground">Leads requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                followUps.filter(
                  (f) => new Date(f.timestamp).toDateString() === new Date().toDateString()
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Interactions today</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search interactions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={selectedLeadFilter} onValueChange={setSelectedLeadFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            {leads.map((lead) => (
              <SelectItem key={lead.id} value={lead.leadNo}>
                {lead.leadNo} - {lead.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Lead Details</TableHead>
              <TableHead>Interaction Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredFollowUps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No follow-up history found.
                </TableCell>
              </TableRow>
            ) : (
              filteredFollowUps.map((fu) => (
                <TableRow key={fu.id}>
                  <TableCell>
                    <Button size="sm" onClick={() => openFollowUpFormForLead(fu.leadNo)}>
                      Record Follow-up
                    </Button>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(fu.timestamp), 'MMM dd, yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(fu.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{getLeadName(fu.leadNo)}</span>
                      <span className="text-xs text-muted-foreground">{fu.leadNo}</span>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-md">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="size-4 mt-1 text-muted-foreground shrink-0" />
                      <p className="text-sm">{fu.whatDidCustomerSay}</p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(fu.leadStatus)}>
                      {fu.leadStatus}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {fu.nextFollowupDate ? (
                      <div className="flex items-center text-sm text-orange-600">
                        <Calendar className="size-3 mr-1" />
                        {format(new Date(fu.nextFollowupDate), 'MMM dd, yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="space-y-4 md:hidden">
        {filteredFollowUps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border p-4">
            No follow-up history found.
          </div>
        ) : (
          filteredFollowUps.map((fu) => (
            <Card key={fu.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{getLeadName(fu.leadNo)}</CardTitle>
                    <CardDescription>{fu.leadNo}</CardDescription>
                  </div>

                  <Badge variant="secondary" className={getStatusColor(fu.leadStatus)}>
                    {fu.leadStatus}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-2 space-y-3">
                <Button className="w-full" onClick={() => openFollowUpFormForLead(fu.leadNo)}>
                  Record Follow-up
                </Button>

                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <p>{fu.whatDidCustomerSay}</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="size-4 mr-1" />
                    {format(new Date(fu.timestamp), 'MMM dd, h:mm a')}
                  </div>

                  {fu.nextFollowupDate && (
                    <div className="flex items-center text-orange-600 font-medium">
                      Next: {format(new Date(fu.nextFollowupDate), 'MMM dd')}
                      <ArrowRight className="size-3 ml-1" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <FollowUpForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddFollowUp}
        preselectedLeadNo={selectedLeadNo}
      />
    </div>
  )
}