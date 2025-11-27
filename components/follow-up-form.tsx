'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { FollowUpHistory, LeadDetails } from '@/lib/types'

// ---------------- Schema ----------------
const followUpSchema = z.object({
  leadNo: z.string().min(1, 'Lead is required'),
  leadStatus: z.enum(['follow-up', 'received', 'cancelled']),
  nextFollowupDate: z.string().optional(),
  whatDidCustomerSay: z.string().min(1, 'Customer feedback is required'),
})

interface FollowUpFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<FollowUpHistory>) => void
  preselectedLeadNo?: string
  leads: LeadDetails[]     // ← Leads from parent
}

export function FollowUpForm({
  open,
  onOpenChange,
  onSubmit,
  preselectedLeadNo,
  leads,
}: FollowUpFormProps) {

  const form = useForm<z.infer<typeof followUpSchema>>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      leadNo: '',
      leadStatus: 'follow-up',
      nextFollowupDate: '',
      whatDidCustomerSay: '',
    },
  })

  // ------------------------------------------
  // Pre-fill lead automatically
  // ------------------------------------------
  useEffect(() => {
    if (preselectedLeadNo) {
      form.setValue('leadNo', preselectedLeadNo)
    }
  }, [preselectedLeadNo])

  // ------------------------------------------
  // Save follow-up into Google Sheets (Flw-Up)
  // ------------------------------------------
  const saveFollowUpToGoogleSheet = async (values: any) => {
    const formData = new URLSearchParams()

    formData.append("action", "insertFollowUp")
    formData.append("leadNo", values.leadNo)
    formData.append("leadStatus", values.leadStatus)
    formData.append("nextFollowupDate", values.nextFollowupDate || "")
    formData.append("whatDidCustomerSay", values.whatDidCustomerSay)

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec",
        {
          method: "POST",
          body: formData,
        }
      )
    } catch (err) {
      console.error("Error saving follow-up:", err)
    }
  }

  // ------------------------------------------
  // Submit handler
  // ------------------------------------------
  const handleSubmit = async (values: z.infer<typeof followUpSchema>) => {
    onSubmit(values)
    onOpenChange(false)
    form.reset()
  }

  // ------------------------------------------
  // UI + Layout (unchanged)
  // ------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Follow-up</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Lead Selection */}
            <FormField
              control={form.control}
              name="leadNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Lead</FormLabel>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!preselectedLeadNo}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lead" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem
                          key={lead.id}
                          value={lead.leadNo}
                        >
                          {lead.leadNo} — {lead.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="leadStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Update</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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

            {/* Next Follow-up Date */}
            <FormField
              control={form.control}
              name="nextFollowupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Follow-up Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Notes */}
            <FormField
              control={form.control}
              name="whatDidCustomerSay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What Did Customer Say</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Conversation details..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Follow-up</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
