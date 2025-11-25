'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { userStorage } from '@/lib/storage'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }

    const formData = new URLSearchParams()
    formData.append('action', 'loginUser')
    formData.append('sheetName', 'Login')
    formData.append('username', username)
    formData.append('password', password)

    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbw_096M3tJVKwb3Cv5O0OqbiuHkyuPkdJ22qoiWPdgzfpc0qVhyJKK67uv5I8-rnzri/exec',
        {
          method: 'POST',
          body: formData
        }
      )

      const result = await response.json()
      console.log('Login result:', result)

      // Handle wrong username/password
      if (!result.success) {
        if (result.error === 'invalid-username') {
          setError('Invalid username')
        } else if (result.error === 'invalid-password') {
          setError('Invalid password')
        } else {
          setError('Login failed')
        }
        return
      }

      // Store authenticated user (role removed for TS safety)
      userStorage.set({
        id: '1',
        username: result.username,
        email: `${result.username}@leadtoorder.com`,
      })

      router.push('/')

    } catch (err) {
      console.error('Login Error:', err)
      setError('Network error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Lead to Order</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full">
              Sign In
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Enter valid username & password from Google Sheet (Login)
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}