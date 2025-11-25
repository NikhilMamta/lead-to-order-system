'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Phone, MapPin, Calendar, Users } from 'lucide-react'
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
import { EnquiryForm } from '@/components/enquiry-form'
import { enquiryStorage } from '@/lib/storage'
import { Enquiry } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export default function EnquiryPage() {
  const { toast } = useToast()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null)

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec'

  // ------------------------------------------
  // 1️⃣ Google Sheet से Enquiries Load करें
  // ------------------------------------------
  const fetchEnquiriesFromGoogleSheet = async () => {
    try {
      const resp = await fetch(`${SCRIPT_URL}?action=getEnquiries&sheetName=Enquiery`)
      const json = await resp.json()

      console.log("Fetched JSON:", json)

      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((row: any) => ({
          id: crypto.randomUUID(),
          timestamp: new Date(row[0]).toISOString(),
          directNoOrLeadNo: row[1],
          receivedType: row[2],
          personName: row[3],
          totalPatient: Number(row[4]) || 0,
          patientName: row[5],
          patientPhoneNumber: row[6],
          patientAddress: row[7],
        }))

        setEnquiries(formatted)
      } else {
        console.warn("Invalid data format:", json)
      }
    } catch (err) {
      console.error('Failed to fetch sheet data:', err)
      toast({ title: 'Error', description: 'Failed to load sheet data' })
    }
  }

  useEffect(() => {
    fetchEnquiriesFromGoogleSheet()
  }, [])

  // ---------------------------------------------------
  // 2️⃣ Add Enquiry → Sheet + Local Backup
  // ---------------------------------------------------
  const saveEnquiryToGoogleSheet = async (enquiry: Enquiry) => {
    const sheetTimestamp = new Date().toLocaleString('en-GB', { hour12: false })

    const rowData = [
      sheetTimestamp,
      enquiry.directNoOrLeadNo || '',
      enquiry.receivedType || '',
      enquiry.personName || '',
      enquiry.totalPatient != null ? String(enquiry.totalPatient) : '',
      enquiry.patientName || '',
      enquiry.patientPhoneNumber || '',
      enquiry.patientAddress || '',
    ]

    const formData = new URLSearchParams()
    formData.append('action', 'insert')
    formData.append('sheetName', 'Enquiery')
    formData.append('rowData', JSON.stringify(rowData))

    const resp = await fetch(SCRIPT_URL, { method: 'POST', body: formData })
    return resp.json()
  }

  const handleAddEnquiry = async (data: Partial<Enquiry>) => {
    const newEnquiry: Enquiry = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    } as Enquiry

    enquiryStorage.add(newEnquiry)

    try {
      const result = await saveEnquiryToGoogleSheet(newEnquiry)
      if (result.success) {
        toast({ title: 'Success', description: 'Enquiry saved successfully' })
        fetchEnquiriesFromGoogleSheet()
      } else {
        toast({
          title: 'Partial Success',
          description: 'Saved locally but not in sheet',
        })
      }
    } catch (err) {
      toast({
        title: 'Saved locally',
        description: 'Error saving to sheet',
      })
    }
  }

  // ---------------------------------------------------
  // 3️⃣ Edit / Delete (local only)
  // ---------------------------------------------------
  const handleEditEnquiry = (data: Partial<Enquiry>) => {
    if (!editingEnquiry) return

    enquiryStorage.update(editingEnquiry.id, data)
    setEditingEnquiry(null)

    toast({
      title: 'Updated',
      description: 'Enquiry updated locally',
    })

    fetchEnquiriesFromGoogleSheet()
  }

  const handleDeleteEnquiry = (id: string) => {
    if (!confirm('Delete this enquiry?')) return

    enquiryStorage.delete(id)

    toast({ title: 'Deleted', description: 'Enquiry deleted locally' })
    fetchEnquiriesFromGoogleSheet()
  }

  const filteredEnquiries = enquiries.filter((enq) =>
    Object.values(enq).some((v) =>
      String(v).toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  const totalPatients = enquiries.reduce(
    (sum, enq) => sum + (enq.totalPatient || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enquiries</h2>
          <p className="text-muted-foreground">Manage all patient enquiries</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="size-4 mr-2" /> Add Enquiry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enquiries.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Direct Enquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {enquiries.filter((e) => e.receivedType === 'direct').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search enquiries..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table: Desktop */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ref No</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Patients</TableHead>
              <TableHead>Patient Names</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredEnquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No enquiries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEnquiries.map((enq) => (
                <TableRow key={enq.id}>
                  <TableCell>{format(new Date(enq.timestamp), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{enq.directNoOrLeadNo}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        enq.receivedType === 'direct'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }
                    >
                      {enq.receivedType}
                    </Badge>
                  </TableCell>
                  <TableCell>{enq.personName}</TableCell>
                  <TableCell>
                    <Users className="size-4 inline mr-1" />
                    {enq.totalPatient}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{enq.patientName}</TableCell>
                  <TableCell>{enq.patientPhoneNumber}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingEnquiry(enq)
                        setIsFormOpen(true)
                      }}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteEnquiry(enq.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredEnquiries.map((enq) => (
          <Card key={enq.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-base">{enq.personName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{enq.directNoOrLeadNo}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    enq.receivedType === 'direct'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-blue-50 text-blue-700'
                  }
                >
                  {enq.receivedType}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span>{enq.totalPatient} Patient(s):</span>
                <span className="truncate">{enq.patientName}</span>
              </div>

              <div className="flex gap-2">
                <Phone className="size-4 text-muted-foreground" />
                {enq.patientPhoneNumber}
              </div>

              <div className="flex gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="text-xs">{enq.patientAddress}</span>
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {format(new Date(enq.timestamp), 'MMM dd, yyyy')}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingEnquiry(enq)
                  setIsFormOpen(true)
                }}
              >
                Edit
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => handleDeleteEnquiry(enq.id)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FORM */}
      <EnquiryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={editingEnquiry ? handleEditEnquiry : handleAddEnquiry}
        initialData={editingEnquiry}
      />
    </div>
  )
}