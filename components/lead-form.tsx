'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
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
import { LeadDetails } from '@/lib/types'

// ------------------------------
// UPDATED SCHEMA (4 fields removed)
// ------------------------------
const leadSchema = z.object({
  leadNo: z.string().min(1, 'Lead No is required'),
  leadReceivedName: z.string().min(1, 'Receiver Name is required'),
  leadSource: z.string().min(1, 'Source is required'),
  companyName: z.string().min(1, 'Company Name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  personName: z.string().min(1, 'Contact Person is required'),
  location: z.string().min(1, 'Location is required'),
  emailAddress: z.string().email('Invalid email address'),
  state: z.string().min(1, 'State is required'),
  address: z.string().min(1, 'Address is required'),
  nob: z.string().min(1, 'Nature of Business is required'),
  remarks: z.string().optional(),
})

interface LeadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<LeadDetails>) => void
  initialData?: LeadDetails | null
}

export function LeadForm({ open, onOpenChange, onSubmit, initialData }: LeadFormProps) {
  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadNo: '',
      leadReceivedName: '',
      leadSource: '',
      companyName: '',
      phoneNumber: '',
      personName: '',
      location: '',
      emailAddress: '',
      state: '',
      address: '',
      nob: '',
      remarks: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        leadNo: initialData.leadNo,
        leadReceivedName: initialData.leadReceivedName,
        leadSource: initialData.leadSource,
        companyName: initialData.companyName,
        phoneNumber: initialData.phoneNumber,
        personName: initialData.personName,
        location: initialData.location,
        emailAddress: initialData.emailAddress,
        state: initialData.state,
        address: initialData.address,
        nob: initialData.nob,
        remarks: initialData.remarks,
      })
    } else {
      form.reset({
        leadNo: `LD${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')}`,
        leadReceivedName: '',
        leadSource: '',
        companyName: '',
        phoneNumber: '',
        personName: '',
        location: '',
        emailAddress: '',
        state: '',
        address: '',
        nob: '',
        remarks: '',
      })
    }
  }, [initialData, form, open])

  const timestamp = new Date()
    .toLocaleString('en-GB', { hour12: false })
    .replace(',', '')

  const saveLeadToGoogleSheet = async (values: any) => {
    const rowData = [
      timestamp,
      values.leadNo,
      values.leadReceivedName,
      values.leadSource,
      values.companyName,
      values.phoneNumber,
      values.personName,
      values.location,
      values.emailAddress,
      values.state,
      values.address,
      values.nob,
      values.remarks || '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]

    const formData = new URLSearchParams()
    formData.append('action', 'insert')
    formData.append('sheetName', 'FMS')
    formData.append('rowData', JSON.stringify(rowData))

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec',
        {
          method: 'POST',
          body: formData,
        }
      )
    } catch (error) {
      console.error('Google Sheet Error:', error)
    }
  }

  const handleSubmit = async (values: z.infer<typeof leadSchema>) => {
    onSubmit(values)
    await saveLeadToGoogleSheet(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            Enter the details for the lead. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Lead No */}
              <FormField
                control={form.control}
                name="leadNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead No</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Received By */}
              <FormField
                control={form.control}
                name="leadReceivedName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Source */}
              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Company Name */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Company" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Contact Person */}
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Person Name" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1234567890" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* State */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="State" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full Address" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* ⭐ UPDATED: Nature of Business DROPDOWN */}
              <FormField
                control={form.control}
                name="nob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature of Business</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Trading">Trading</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="IT">IT / Software</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Remarks */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter remarks..." />
                    </FormControl>
                  </FormItem>
                )}
              />

            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Lead</Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}