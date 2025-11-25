'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Shield, Bell, Database, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { userStorage, storage } from '@/lib/storage'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<{ username: string; email: string } | null>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
  })

  useEffect(() => {
    const currentUser = userStorage.get()
    if (currentUser) {
      setUser(currentUser)
    }
  }, [])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (user) {
      userStorage.set({ ...user, id: '1' })
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    }
  }

  const handleClearData = () => {
    if (confirm('Are you sure? This will delete ALL leads, enquiries, and history. This cannot be undone.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="username"
                      className="pl-8"
                      value={user.username}
                      onChange={(e) => setUser({ ...user, username: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-8"
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <Button type="submit">
                    <Save className="size-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label className="font-medium">Email Notifications</Label>
                  <span className="text-xs text-muted-foreground">Receive daily summaries via email</span>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(c) => setNotifications({ ...notifications, email: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label className="font-medium">Push Notifications</Label>
                  <span className="text-xs text-muted-foreground">Receive real-time alerts for follow-ups</span>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(c) => setNotifications({ ...notifications, push: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label className="font-medium">Weekly Report</Label>
                  <span className="text-xs text-muted-foreground">Receive a weekly performance report</span>
                </div>
                <Switch
                  checked={notifications.weekly}
                  onCheckedChange={(c) => setNotifications({ ...notifications, weekly: c })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: 'Success', description: 'Notification preferences saved' })}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Management</CardTitle>
              <CardDescription>Manage application data and storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="size-4" />
                  <h3 className="font-medium">Data Storage</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  All data is currently stored locally in your browser. Clearing your browser cache will remove all data.
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="size-4 text-green-600" />
                  <span>Local Storage Active</span>
                </div>
              </div>

              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2 text-destructive">
                  <Trash2 className="size-4" />
                  <h3 className="font-medium">Danger Zone</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete all leads, enquiries, and history data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleClearData}>
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
