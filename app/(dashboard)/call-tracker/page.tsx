'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, MessageSquare, ArrowRight, Phone, Mail } from 'lucide-react'
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
  // NEW: Accurate counters
  const [totalInteractions, setTotalInteractions] = useState<number>(0)
  const [todaysActivity, setTodaysActivity] = useState<number>(0)

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec'

  // Fetch FMS (master) + Flw-Up (follow-ups), apply planned/actual filter, merge latest follow-up into leads
  const loadData = async () => {
    try {
      // 1) Fetch FMS
      const fmsResp = await fetch(`${SCRIPT_URL}?action=getLeads`)
      const fmsJson = await fmsResp.json()
      if (!fmsJson.success || !Array.isArray(fmsJson.data)) {
        console.error('FMS fetch error', fmsJson)
        return
      }

      // 2) Fetch Flw-Up
      const flwResp = await fetch(`${SCRIPT_URL}?action=getFollowUps`)
      const flwJson = await flwResp.json()
      if (!flwJson.success || !Array.isArray(flwJson.data)) {
        console.error('Flw-Up fetch error', flwJson)
      }

      // 3) Apply Planned/Actual filter on FMS rows
      // Per your sheet: Planned is column index 13, Actual is 14 (0-based indexing)
      const filteredFmsRows = fmsJson.data.filter((row: any) => {
        const planned = row[13]
        const actual = row[14]
        // Show only if planned is not null/empty AND actual is null/empty
        return planned && planned.toString().trim() !== '' && (!actual || actual.toString().trim() === '')
      })

      // 4) Map FLW rows to objects (if available)
      const flwRows = Array.isArray(flwJson.data)
        ? flwJson.data.map((r: any) => ({
            timestamp: r[0],
            leadNo: (r[1] || '').toString(),
            leadStatus: r[2] || '',
            nextFollowupDate: r[3] || '',
            whatDidCustomerSay: r[4] || '',
          }))
        : []
        

      // 5) Build leads array from filtered FMS rows
      const builtLeads: LeadDetails[] = filteredFmsRows.map((row: any, idx: number) => {
        const leadNo = (row[1] || '').toString()
        // find latest follow-up for this lead (if any)
        const matching = flwRows
          .filter((f: any) => f.leadNo === leadNo)
          .sort((a: any, b: any) => {
            const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
            const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
            return tb - ta
          })

        const latest = matching.length > 0 ? matching[0] : null

        return {
          id: `lead-${idx}`,
          leadNo: leadNo || `unknown-${idx}`,
          leadReceivedName: row[2] || 'N/A',
          leadSource: row[3] || 'N/A',
          companyName: row[4] || 'N/A',
          phoneNumber: row[5] || 'N/A',
          personName: row[6] || 'N/A',
          location: row[7] || 'N/A',
          emailAddress: row[8] || 'N/A',
          state: row[9] || 'N/A',
          address: row[10] || 'N/A',
          nob: row[11] || 'N/A',
          remarks: row[12] || 'N/A',
          // leadStatus: latest ? (latest.leadStatus || 'received') : 'received',
          leadStatus: latest ? (latest.leadStatus || '') : '',
          nextFollowupDate: latest ? latest.nextFollowupDate || '' : '',
          whatDidCustomerSay: latest ? latest.whatDidCustomerSay || '' : '',
        } as LeadDetails
      })

      // 6) Create followUps state from the merged latest follow-ups (one per lead)
      const builtFollowUps: FollowUpHistory[] = builtLeads.map((l) => ({
        id: crypto.randomUUID(),
        timestamp: l.nextFollowupDate ? new Date(l.nextFollowupDate).toISOString() : new Date().toISOString(),
        leadNo: l.leadNo,
        leadStatus: l.leadStatus,
        nextFollowupDate: l.nextFollowupDate,
        whatDidCustomerSay: l.whatDidCustomerSay,
      }))

      // 7) Set state (and update local storage if you need)
      setLeads(builtLeads)
      setFollowUps(builtFollowUps)

      // Optional: update your client-side leadStorage if you use it elsewhere
      // NOTE: use only getAll/update methods your storage exposes. 
      // I am **not** calling setAll here because earlier you had a TypeScript error when storage didn't implement setAll.
      // If your storage has setAll, you can uncomment the next line:
      // leadStorage.setAll?.(builtLeads)
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  let isSavingFollowUp = false

  // Save follow-up to Flw-Up sheet (only) and then reload
  const handleAddFollowUp = async (data: Partial<FollowUpHistory>) => {
  if (isSavingFollowUp) return
  isSavingFollowUp = true

  try {
    const newFollowUp: FollowUpHistory = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      leadStatus: data.leadStatus || 'received',
      leadNo: data.leadNo ?? '',               // ensure string
      nextFollowupDate: data.nextFollowupDate ?? '',
      whatDidCustomerSay: data.whatDidCustomerSay ?? '',
    }

    followUpStorage.add(newFollowUp)

    // SAVE TO GOOGLE SHEET (one time only)
    const formData = new URLSearchParams()
    formData.append('action', 'insertFollowUp')
    formData.append('leadNo', data.leadNo || '')
    formData.append('leadStatus', data.leadStatus || '')
    formData.append('nextFollowupDate', data.nextFollowupDate || '')
    formData.append('whatDidCustomerSay', data.whatDidCustomerSay || '')

    await fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData,
    })

    toast({
      title: 'Success',
      description: 'Follow-up recorded successfully',
    })

    await loadData()

  } finally {
    isSavingFollowUp = false
  }
}


  const filteredFollowUps = followUps.filter((fu) => {
    const matchesSearch =
      fu.leadNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fu.whatDidCustomerSay || '').toLowerCase().includes(searchQuery.toLowerCase())

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
    <div className="space-y-6 px-3 sm:px-4 md:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
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
      <div className="hidden md:block rounded-md border bg-card overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Lead No.</TableHead>
              <TableHead>Lead Receiver Name</TableHead>
              <TableHead>Lead Source</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Person Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>NOB</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>What Did The Customer Say</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredFollowUps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-8 text-muted-foreground">
                  No follow-up history found.
                </TableCell>
              </TableRow>
            ) : (
              filteredFollowUps.map((fu) => {
                const lead = leads.find((l) => l.leadNo === fu.leadNo)

                return (
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
                        <span className="font-medium">{fu.leadNo}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{lead?.leadReceivedName}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{lead?.leadSource}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{lead?.companyName || 'N/A'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{lead?.personName || 'N/A'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-xs">
                          <Phone className="size-3 mr-1" /> {lead?.phoneNumber || 'N/A'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center text-xs">
                        <Mail className="size-3 mr-1" /> {lead?.emailAddress || 'N/A'}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm break-words whitespace-normal">{lead?.location || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm break-words whitespace-normal">{lead?.state || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm break-words whitespace-normal">{lead?.address || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm break-words whitespace-normal">{lead?.nob || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm break-words whitespace-normal">{lead?.remarks || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm break-words whitespace-normal">{fu.whatDidCustomerSay || '-'}</div>
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
                )
              })
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
                    <p className="text-sm text-muted-foreground">{leads.find(l => l.leadNo === fu.leadNo)?.personName}</p>
                  </div>

                  <Badge variant="secondary" className={getStatusColor(fu.leadStatus || "pending")}>
                    {fu.leadStatus}
                  </Badge>

                </div>
              </CardHeader>

              <CardContent className="pb-2 space-y-3 text-sm">

                {/* Lead No - Phone - Email */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lead No:</span>
                    <span className="font-medium">{fu.leadNo}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{leads.find(l => l.leadNo === fu.leadNo)?.phoneNumber}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="break-words whitespace-normal">
                      {leads.find(l => l.leadNo === fu.leadNo)?.emailAddress}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      {leads.find(l => l.leadNo === fu.leadNo)?.location},{' '}
                      {leads.find(l => l.leadNo === fu.leadNo)?.state}
                    </span>
                  </div>
                </div>

                {/* Follow up button */}
                <Button className="w-full" onClick={() => openFollowUpFormForLead(fu.leadNo)}>
                  Record Follow-up
                </Button>

                {/* Customer said */}
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <p>{fu.whatDidCustomerSay}</p>
                </div>

                {/* Dates */}
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
        leads={leads}
      />
    </div>
  )
}