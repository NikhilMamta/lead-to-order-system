'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LeadForm } from '@/components/lead-form'
import { LeadDetails } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

const SHEET_URL =
  'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec'

// 🔥 SAFE Date Converter (Google Sheet → Valid JS Date)
function convertDate(value: string) {
  if (!value) return new Date().toISOString()

  const clean = value.replace(/-/g, '/')
  const parts = clean.split(' ')
  const date = parts[0].split('/')
  const time = parts[1] || '00:00:00'

  const formatted = `${date[2]}-${date[1]}-${date[0]}T${time}`
  const parsed = new Date(formatted)

  if (isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

export default function LeadDetailsPage() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<LeadDetails[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<LeadDetails | null>(null)

  const loadLeads = async () => {
    try {
      const res = await fetch(`${SHEET_URL}?action=getLeads&sheetName=FMS`)
      const json = await res.json()

      if (json && json.success && Array.isArray(json.data)) {
        const cleanedRows = json.data.slice(0).filter((r: string[]) => r[1]);
        const mapped: LeadDetails[] = cleanedRows.map((r: any[]) => ({
          id: crypto.randomUUID(),
          timestamp: convertDate(r[0]),
          leadNo: r[1] || '',
          leadReceivedName: r[2] || '',
          leadSource: r[3] || '',
          companyName: r[4] || '',
          phoneNumber: r[5] || '',
          personName: r[6] || '',
          location: r[7] || '',
          emailAddress: r[8] || '',
          state: r[9] || '',
          address: r[10] || '',
          nob: r[11] || '',
          remarks: r[12] || '',
          planned: r[13] || '',
          actual: r[14] || '',
          leadStatus: r[16] || 'follow-up',
          nextFollowupDate: r[17] || '',
          whatDidCustomerSay: r[18] || '',
          timeDelay: r[19] || '0 days',
          planned1: '',
          actual1: '',
          timeDelay1: '',
          status1: 'pending',
        }))

        setLeads(mapped)
      }
      else {
              setLeads([])
            }
          } catch (err) {
            console.error('Sheet Fetch Error:', err)
            toast({
              title: 'Error',
              description: 'Failed to load leads from sheet',
            })
          }
        }

  useEffect(() => {
    loadLeads()
  }, [])

  const handleAddLead = async () => {
    toast({
      title: 'Saving...',
      description: 'Saving lead to sheet. UI will refresh shortly.',
    })

    setTimeout(async () => {
      await loadLeads()
      toast({
        title: 'Success',
        description: 'Lead added successfully',
      })
    }, 1000)
  }

  const handleEditLead = async () => {
    await loadLeads()
    setEditingLead(null)
    toast({
      title: 'Updated',
      description: 'Lead updated',
    })
  }

  const handleDeleteLead = (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    setLeads((prev) => prev.filter((l) => l.id !== id))
    toast({
      title: 'Deleted',
      description: 'Lead removed from the UI',
    })
  }

  const openEditModal = (lead: LeadDetails) => {
    setEditingLead(lead)
    setIsFormOpen(true)
  }

  const openAddModal = () => {
    setEditingLead(null)
    setIsFormOpen(true)
  }

  const filteredLeads = leads.filter((lead) =>
    Object.values(lead).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Details</h2>
          <p className="text-muted-foreground">Manage and track all your leads in one place</p>
        </div>
        <Button onClick={openAddModal} className="w-full sm:w-auto">
          <Plus className="size-4 mr-2" />
          Add New Lead
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSearchQuery('')}>All Leads</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSearchQuery('follow-up')}>Follow Up</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSearchQuery('received')}>Received</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSearchQuery('cancelled')}>Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Company / Person</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Follow-up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No leads found. Add a new lead to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.leadNo}</TableCell>
                  <TableCell>{format(new Date(lead.timestamp), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.companyName}</span>
                      <span className="text-xs text-muted-foreground">{lead.personName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-xs">
                        <Phone className="size-3 mr-1" /> {lead.phoneNumber}
                      </div>
                      <div className="flex items-center text-xs">
                        <Mail className="size-3 mr-1" /> {lead.emailAddress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{lead.location}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(lead.leadStatus)}>
                      {lead.leadStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.nextFollowupDate ? (
                      <div className="flex items-center text-sm">
                        <Calendar className="size-3 mr-1" />
                        {lead.nextFollowupDate}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(lead)}
                        className="h-8 w-8"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLead(lead.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredLeads.map((lead) => (
          <Card key={lead.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{lead.companyName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{lead.personName}</p>
                </div>
                <Badge variant="secondary" className={getStatusColor(lead.leadStatus)}>
                  {lead.leadStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lead No:</span>
                <span className="font-medium">{lead.leadNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span>{lead.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span className="truncate">{lead.emailAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span>
                  {lead.location}, {lead.state}
                </span>
              </div>
              {lead.nextFollowupDate && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Calendar className="size-4" />
                  <span>Next: {lead.nextFollowupDate}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 border-t flex justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(lead.timestamp), 'MMM dd, yyyy')}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(lead)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteLead(lead.id)}
                >
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <LeadForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={editingLead ? handleEditLead : handleAddLead}
        initialData={editingLead}
      />
    </div>
  )
}