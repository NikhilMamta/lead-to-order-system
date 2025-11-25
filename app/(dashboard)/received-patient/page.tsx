'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Users, Phone, MapPin, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { enquiryStorage, leadStorage } from '@/lib/storage'
import { Enquiry } from '@/lib/types'

export default function ReceivedPatientPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Filter only received patients (status = received from leads)
    const allEnquiries = enquiryStorage.getAll()
    const leads = leadStorage.getAll()
    
    // Get enquiries where the lead status is 'received' or direct enquiries
    const receivedEnquiries = allEnquiries.filter(enq => {
      if (enq.receivedType === 'direct') return true
      const lead = leads.find(l => l.leadNo === enq.directNoOrLeadNo)
      return lead && lead.leadStatus === 'received'
    })
    
    setEnquiries(receivedEnquiries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ))
  }

  const filteredEnquiries = enquiries.filter((enq) =>
    Object.values(enq).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const totalPatients = enquiries.reduce((sum, enq) => sum + enq.totalPatient, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Received Patients</h2>
          <p className="text-muted-foreground">View all patients received from successful conversions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{enquiries.length}</div>
            <p className="text-xs text-muted-foreground">Successful conversions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">Individual patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {enquiries.filter(e => 
                new Date(e.timestamp).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Received this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search received patients..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Received</TableHead>
              <TableHead>Reference No</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Patients</TableHead>
              <TableHead>Patient Details</TableHead>
              <TableHead>Contact Info</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No received patients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEnquiries.map((enq) => (
                <TableRow key={enq.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(enq.timestamp), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">{enq.directNoOrLeadNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      enq.receivedType === 'direct' 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'bg-blue-50 text-blue-700'
                    }>
                      {enq.receivedType === 'direct' ? 'Direct' : 'From Lead'}
                    </Badge>
                  </TableCell>
                  <TableCell>{enq.personName}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="size-4 mr-1 text-muted-foreground" />
                      {enq.totalPatient}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{enq.patientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center">
                        <Phone className="size-3 mr-1" />
                        {enq.patientPhoneNumber}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="size-3 mr-1" />
                        <span className="truncate max-w-[150px]">{enq.patientAddress}</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredEnquiries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border p-4">
            No received patients found.
          </div>
        ) : (
          filteredEnquiries.map((enq) => (
            <Card key={enq.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{enq.personName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{enq.directNoOrLeadNo}</p>
                  </div>
                  <Badge variant="outline" className={
                    enq.receivedType === 'direct' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'bg-blue-50 text-blue-700'
                  }>
                    {enq.receivedType === 'direct' ? 'Direct' : 'Lead'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="font-medium">{enq.totalPatient} Patient(s):</span>
                  <span className="truncate">{enq.patientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{enq.patientPhoneNumber}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 text-muted-foreground mt-0.5" />
                  <span className="text-xs">{enq.patientAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="size-3" />
                  <span>Received: {format(new Date(enq.timestamp), 'MMM dd, yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
