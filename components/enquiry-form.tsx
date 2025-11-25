'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Enquiry, LeadDetails } from '@/lib/types'
import { leadStorage } from '@/lib/storage'

const enquirySchema = z.object({
  directNoOrLeadNo: z.string().min(1, 'Direct No / Lead No is required'),
  receivedType: z.enum(['direct', 'lead']),
  personName: z.string().min(1, 'Person Name is required'),
  totalPatient: z.coerce.number().min(1, 'Total patients must be at least 1'),
  patientName: z.string().min(1, 'Patient Name is required'),
  patientPhoneNumber: z.string().min(10, 'Valid phone number is required'),
  patientAddress: z.string().min(1, 'Patient Address is required'),
})

interface EnquiryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Enquiry>) => void
  initialData?: Enquiry | null
  preselectedLeadNo?: string
}

export function EnquiryForm({ open, onOpenChange, onSubmit, initialData, preselectedLeadNo }: EnquiryFormProps) {
  const [leads, setLeads] = useState<LeadDetails[]>([])
  const [receivedType, setReceivedType] = useState<'direct' | 'lead'>('direct')

  const form = useForm<z.infer<typeof enquirySchema>>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      directNoOrLeadNo: preselectedLeadNo || '',
      receivedType: preselectedLeadNo ? 'lead' : 'direct',
      personName: '',
      // totalPatient: 1,
      patientName: '',
      patientPhoneNumber: '',
      patientAddress: '',
    },
  })

  useEffect(() => {
    setLeads(leadStorage.getAll())
  }, [])

  useEffect(() => {
    if (initialData) {
      form.reset({
        directNoOrLeadNo: initialData.directNoOrLeadNo,
        receivedType: initialData.receivedType,
        personName: initialData.personName,
        totalPatient: initialData.totalPatient,
        patientName: initialData.patientName,
        patientPhoneNumber: initialData.patientPhoneNumber,
        patientAddress: initialData.patientAddress,
      })
      setReceivedType(initialData.receivedType)
    } else if (preselectedLeadNo) {
      form.setValue('directNoOrLeadNo', preselectedLeadNo)
      form.setValue('receivedType', 'lead')
      setReceivedType('lead')
      
      // Pre-fill person name from lead
      const lead = leads.find(l => l.leadNo === preselectedLeadNo)
      if (lead) {
        form.setValue('personName', lead.personName)
      }
    } else {
      form.reset({
        directNoOrLeadNo: `DIR${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        receivedType: 'direct',
        personName: '',
        totalPatient: 1,
        patientName: '',
        patientPhoneNumber: '',
        patientAddress: '',
      })
      setReceivedType('direct')
    }
  }, [initialData, preselectedLeadNo, form, open, leads])

  const handleSubmit = (values: z.infer<typeof enquirySchema>) => {
    onSubmit(values)
    onOpenChange(false)
  }

  const handleReceivedTypeChange = (value: 'direct' | 'lead') => {
    setReceivedType(value)
    form.setValue('receivedType', value)
    
    if (value === 'direct') {
      form.setValue('directNoOrLeadNo', `DIR${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`)
    } else {
      form.setValue('directNoOrLeadNo', '')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Enquiry' : 'Add New Enquiry'}</DialogTitle>
          <DialogDescription>
            Enter the enquiry and patient details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receivedType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enquiry Type</FormLabel>
                    <Select 
                      onValueChange={handleReceivedTypeChange} 
                      defaultValue={field.value}
                      disabled={!!preselectedLeadNo}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">Direct Enquiry</SelectItem>
                        <SelectItem value="lead">From Lead</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="directNoOrLeadNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{receivedType === 'direct' ? 'Direct No' : 'Lead No'}</FormLabel>
                    {receivedType === 'direct' ? (
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted" />
                      </FormControl>
                    ) : (
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!!preselectedLeadNo}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map(lead => (
                            <SelectItem key={lead.id} value={lead.leadNo}>
                              {lead.leadNo} - {lead.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Person Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="totalPatient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Patients</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Patient Name(s)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="If multiple, separate with commas" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="patientPhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1234567890" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="patientAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Patient Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Full address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Enquiry</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
