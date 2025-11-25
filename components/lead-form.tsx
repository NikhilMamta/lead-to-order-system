'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { LeadDetails } from '@/lib/types'

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
  planned: z.string().optional(),
  actual: z.string().optional(),
  leadStatus: z.enum(['follow-up', 'received', 'cancelled']),
  nextFollowupDate: z.string().optional(),
  whatDidCustomerSay: z.string().optional(),
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
      planned: '',
      actual: '',
      leadStatus: 'follow-up',
      nextFollowupDate: '',
      whatDidCustomerSay: '',
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
        planned: initialData.planned,
        actual: initialData.actual,
        leadStatus: initialData.leadStatus,
        nextFollowupDate: initialData.nextFollowupDate,
        whatDidCustomerSay: initialData.whatDidCustomerSay,
      })
    } else {
      form.reset({
        leadNo: `LD${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
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
        planned: format(new Date(), 'yyyy-MM-dd'),
        actual: '',
        leadStatus: 'follow-up',
        nextFollowupDate: '',
        whatDidCustomerSay: '',
      })
    }
  }, [initialData, form, open])

const timestamp = new Date()
  .toLocaleString("en-GB", { hour12: false })
  .replace(",", "");

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
  values.remarks || "",
  values.planned || "",
  values.actual || "",
  "",
  values.leadStatus,
  values.nextFollowupDate || "",
  values.whatDidCustomerSay || ""
];


  const formData = new URLSearchParams();
  formData.append("action", "insert");
  formData.append("sheetName", "FMS"); 
  formData.append("rowData", JSON.stringify(rowData));

  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    console.log("Google Sheet Response:", result);

    if (!result.success) {
      alert("Failed to save to Google Sheet: " + result.error);
    }

  } catch (error) {
    console.error("Google Sheet Error:", error);
  }
};

  const handleSubmit = async (values: z.infer<typeof leadSchema>) => {
  onSubmit(values);                  
  await saveLeadToGoogleSheet(values);  
  onOpenChange(false);                  
};


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
              <FormField
                control={form.control}
                name="leadNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead No</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadReceivedName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Person Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+1234567890" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="State" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full Address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature of Business</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NOB" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="follow-up">Follow Up</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="planned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextFollowupDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Follow-up</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter remarks here..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatDidCustomerSay"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>What Did Customer Say</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Customer feedback..." />
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
              <Button type="submit">Save Lead</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}