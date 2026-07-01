'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrapper, Card, Title, Subtitle, Field, Label, Input, Button, Success, Error as ErrorMsg, BackLink } from './styles'

export default function ResetPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(String(data?.error ?? 'Failed to send reset email'))
      }
      setSuccess('If this email is registered, you will receive a password reset link shortly.')
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Wrapper>
      <Card>
        <Title>Reset Password</Title>
        <Subtitle>
          Enter your email address and we'll send you a link to reset your password.
        </Subtitle>

        {error && <ErrorMsg>{error}</ErrorMsg>}
        {success && <Success>{success}</Success>}

        <form onSubmit={handleSubmit}>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <BackLink onClick={() => router.push('/login')}>
          Back to Sign In
        </BackLink>
      </Card>
    </Wrapper>
  )
}
