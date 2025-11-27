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

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec'

  // --------------------------------------------------
  // ⭐ NEW FUNCTION: Fetch FMS sheet data (single source)
  // --------------------------------------------------
  const fetchFMSFromGoogleSheet = async () => {
  try {
    const resp = await fetch(`${SCRIPT_URL}?action=getLeads`)
    const json = await resp.json()

    console.log('FMS SHEET DATA:', json)

    if (json.success && Array.isArray(json.data)) {

      // 🔥 FILTER rows based on Planned/Actual conditions
      const validRows = json.data.filter((row: any) => {
        const planned = row[13];
        const actual = row[14];

        // Show only if: planned NOT null/empty AND actual null/empty
        return planned && planned.trim() !== "" && (!actual || actual.trim() === "");
      });

      // Continue with formatted list (same as before)
      const formatted: FollowUpHistory[] = validRows.map((row: any) => {
        const timestampRaw = row[0];
        const leadNo = (row[1] || "").toString();

        return {
          id: crypto.randomUUID(),
          timestamp: timestampRaw ? new Date(timestampRaw).toISOString() : new Date().toISOString(),
          leadNo: leadNo,
          leadStatus: "received",
          nextFollowupDate: "",
          whatDidCustomerSay: "",
        } as FollowUpHistory;
      });

      setFollowUps(formatted);

      const formattedLeads: LeadDetails[] = validRows.map((row: any, index: number) => ({
        id: `lead-${index}`,
        leadNo: (row[1] || "").toString(),

        leadReceivedName: row[2] || "N/A",
        leadSource: row[3] || "N/A",
        companyName: row[4] || "N/A",
        phoneNumber: row[5] || "N/A",
        personName: row[6] || "N/A",

        location: row[7] || "N/A",
        emailAddress: row[8] || "N/A",
        state: row[9] || "N/A",
        address: row[10] || "N/A",
        nob: row[11] || "N/A",
        remarks: row[12] || "N/A",

        leadStatus: "received",
        nextFollowupDate: "",
        whatDidCustomerSay: "",
      }));

      setLeads(formattedLeads);
      leadStorage.setAll(formattedLeads)
    }
  } catch (err) {
    console.error('Error loading FMS data:', err)
  }
}


  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // fetch only from FMS sheet (no Flw-Up sheet)
    fetchFMSFromGoogleSheet()
    // setLeads(leadStorage.getAll())
  }

  // -------------------------------------------------------------------------
  // NOTE: Removed saveFollowUpToGoogleSheet - follow-ups will be local only
  // -------------------------------------------------------------------------
  const handleAddFollowUp = async (data: Partial<FollowUpHistory>) => {
    const newFollowUp: FollowUpHistory = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      leadStatus: data.leadStatus || 'received',
    } as FollowUpHistory

    // persist locally (existing behavior)
    followUpStorage.add(newFollowUp)

    // update lead info in local leadStorage if lead exists
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

    // refresh UI data (we still fetch FMS for authoritative data)
    loadData()

    toast({
      title: 'Success',
      description: 'Follow-up recorded successfully',
    })
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
    // If companyName missing, return 'Unknown Lead' to match previous behavior
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
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No follow-up history found.
                </TableCell>
              </TableRow>
            ) : (
              filteredFollowUps.map((fu) => {
                // find matching lead for this follow-up (from local leadStorage)
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
                        {/* <span className="text-xs text-muted-foreground">{lead?.personName || 'N/A'}</span> */}
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
                        <p className="text-sm">{lead?.location || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm">{lead?.state || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm">{lead?.address || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm">{lead?.nob || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <div className="flex items-start gap-2">
                        <p className="text-sm">{lead?.remarks || 'N/A'}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">{fu.whatDidCustomerSay || '-'}</div>
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
