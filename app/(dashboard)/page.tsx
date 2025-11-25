'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Phone, Users, MessageSquare, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { leadStorage, enquiryStorage, followUpStorage } from '@/lib/storage'
import { LeadDetails } from '@/lib/types'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    followUpLeads: 0,
    receivedPatients: 0,
    totalEnquiries: 0,
    pendingFollowUps: 0,
  })
  const [recentLeads, setRecentLeads] = useState<LeadDetails[]>([])

  useEffect(() => {
    const leads = leadStorage.getAll()
    const enquiries = enquiryStorage.getAll()
    const followUps = followUpStorage.getAll()

    const followUpLeads = leads.filter((lead) => lead.leadStatus === 'follow-up')
    const receivedLeads = leads.filter((lead) => lead.leadStatus === 'received')
    const today = new Date().toISOString().split('T')[0]
    const pendingFollowUps = followUpLeads.filter(
      (lead) => lead.nextFollowupDate && lead.nextFollowupDate <= today
    )

    setStats({
      totalLeads: leads.length,
      followUpLeads: followUpLeads.length,
      receivedPatients: receivedLeads.length,
      totalEnquiries: enquiries.length,
      pendingFollowUps: pendingFollowUps.length,
    })

    // Get 5 most recent leads
    setRecentLeads(leads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5))
  }, [])

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Follow-up Leads',
      value: stats.followUpLeads,
      icon: Phone,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Received Patients',
      value: stats.receivedPatients,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Enquiries',
      value: stats.totalEnquiries,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pending Follow-ups',
      value: stats.pendingFollowUps,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Conversion Rate',
      value: stats.totalLeads > 0 ? `${Math.round((stats.receivedPatients / stats.totalLeads) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome to your Lead to Order management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leads found.</p>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.leadReceivedName}</p>
                      <p className="text-xs text-muted-foreground">{lead.companyName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        lead.leadStatus === 'received' ? 'bg-green-100 text-green-700' :
                        lead.leadStatus === 'follow-up' ? 'bg-orange-100 text-orange-700' :
                        lead.leadStatus === 'cancel' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.leadStatus}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(lead.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/lead-details">
                  View All Leads <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Link
                href="/lead-details"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <FileText className="size-5 text-blue-600" />
                <div>
                  <p className="font-medium">Add New Lead</p>
                  <p className="text-xs text-muted-foreground">Create a new lead entry</p>
                </div>
              </Link>
              <Link
                href="/call-tracker"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <Phone className="size-5 text-orange-600" />
                <div>
                  <p className="font-medium">Track Calls</p>
                  <p className="text-xs text-muted-foreground">View call history</p>
                </div>
              </Link>
              <Link
                href="/received-patient"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <Users className="size-5 text-green-600" />
                <div>
                  <p className="font-medium">Patient Records</p>
                  <p className="text-xs text-muted-foreground">Manage patients</p>
                </div>
              </Link>
              <Link
                href="/enquiry"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <MessageSquare className="size-5 text-purple-600" />
                <div>
                  <p className="font-medium">New Enquiry</p>
                  <p className="text-xs text-muted-foreground">Add enquiry</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
