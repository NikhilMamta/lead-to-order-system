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
// FORM SCHEMA (Lead No removed)
// ------------------------------
const leadSchema = z.object({
  leadReceivedName: z.string().min(1, 'Receiver Name is required'),
  leadSource: z.string().min(1, 'Source is required'),
  companyName: z.string().min(1, 'Company Name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  personName: z.string().min(1, 'Contact Person is required'),
  location: z.string().min(1, 'Location is required'),
  emailAddress: z.string().email('Invalid email'),
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
      form.reset()
    }
  }, [initialData, form, open])

  // -------------------------------------------------
  // ⭐ NEW: Fetch Last Lead No From Script API
  // -------------------------------------------------
  const fetchLastLeadNo = async () => {
    try {
      const resp = await fetch(
        'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec?action=getLastLeadNo'
      );
      const json = await resp.json();
      return json.lastLeadNo || "";
    } catch (err) {
      console.error("Failed to fetch last lead no:", err);
      return "";
    }
  };

  // -------------------------------------------------
  // ⭐ NEW: Auto-generate Sequential Lead Number
  // -------------------------------------------------
  const generateSequentialLeadNo = async () => {
    const last = await fetchLastLeadNo(); // e.g. "LN-015"

    if (!last || last.trim() === "") return "LN-001";

    const num = parseInt(last.split("-")[1] || "0");
    const nextNum = (num + 1).toString().padStart(3, "0");

    return `LN-${nextNum}`;
  };

  const timestamp = new Date()
    .toLocaleString('en-GB', { hour12: false })
    .replace(',', '')

  // -------------------------------------------------
  // Save to Google Sheet
  // -------------------------------------------------
  const saveLeadToGoogleSheet = async (values: any, leadNo: string) => {
    const rowData = [
      timestamp,
      leadNo,
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
      '', // Planned
      '', // Actual
      '', '', '', ''
    ]

    const formData = new URLSearchParams()
    formData.append('action', 'insert')
    formData.append('sheetName', 'FMS')
    formData.append('rowData', JSON.stringify(rowData))

    await fetch(
      'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec',
      {
        method: 'POST',
        body: formData,
      }
    )
  }

  // -------------------------------------------------
  // ⭐ IMPORTANT: Handle Submit
  // -------------------------------------------------
  const handleSubmit = async (values: z.infer<typeof leadSchema>) => {
    const newLeadNo = await generateSequentialLeadNo();   // ⭐ Now sequential

    onSubmit({ ...values, leadNo: newLeadNo })
    await saveLeadToGoogleSheet(values, newLeadNo)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>Fill in the details below to save this lead.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Receiver Name */}
              <FormField
                control={form.control}
                name="leadReceivedName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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

              {/* Company */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* Person Name */}
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} type="email" /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* Address – Full Width */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Full Address</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />

              {/* NOB */}
              <FormField
                control={form.control}
                name="nob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature of Business</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
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

              {/* Remarks – Full Width */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Write remarks here..." />
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