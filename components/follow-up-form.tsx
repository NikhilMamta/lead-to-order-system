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
import { FollowUpHistory, LeadDetails } from '@/lib/types'
import { leadStorage } from '@/lib/storage'

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
}

export function FollowUpForm({
  open,
  onOpenChange,
  onSubmit,
  preselectedLeadNo,
}: FollowUpFormProps) {
  const [leads, setLeads] = useState<LeadDetails[]>([])

  const form = useForm<z.infer<typeof followUpSchema>>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      leadNo: preselectedLeadNo || '',
      leadStatus: 'follow-up',
      nextFollowupDate: '',
      whatDidCustomerSay: '',
    },
  })

  // ---------------- Load ONLY selected lead ----------------
  useEffect(() => {
    const allLeads = leadStorage.getAll()

    if (preselectedLeadNo) {
      const selected = allLeads.filter(l => l.leadNo === preselectedLeadNo)
      setLeads(selected)
      form.setValue('leadNo', preselectedLeadNo)
    } else {
      setLeads(allLeads)
    }
  }, [preselectedLeadNo])

  // ---------------- Submit ----------------
  const handleSubmit = (values: z.infer<typeof followUpSchema>) => {
    onSubmit(values)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Follow-up</DialogTitle>
          <DialogDescription>Record a new interaction with a lead.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* ---------- Lead Selection (Locked to clicked row) ---------- */}
            <FormField
              control={form.control}
              name="leadNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Lead</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!preselectedLeadNo} // 🔥 Lock dropdown
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lead" />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ---------- Lead Status ---------- */}
            <FormField
              control={form.control}
              name="leadStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Update</FormLabel>
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

            {/* ---------- Next Follow-up Date ---------- */}
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

            {/* ---------- Customer Response ---------- */}
            <FormField
              control={form.control}
              name="whatDidCustomerSay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What Did Customer Say</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Record the conversation details..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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
