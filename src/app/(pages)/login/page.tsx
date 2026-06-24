'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import styled from 'styled-components'

const Wrapper = styled.div`
  min-height: 100vh;
  background: #07071a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 20px;
  padding: 40px 32px;
  backdrop-filter: blur(12px);
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  text-align: center;
  margin-bottom: 8px;
`

const Subtitle = styled.p`
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 32px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
`

const Input = styled.input`
  width: 100%;
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }
`

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;

  &:hover { opacity: 0.92; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Error = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
`

const Toggle = styled.button`
  background: none;
  border: none;
  color: #a78bfa;
  font-size: 13px;
  cursor: pointer;
  margin-top: 16px;
  display: block;
  width: 100%;
  text-align: center;

  &:hover { color: #c4b5fd; }
`

const Select = styled.select`
  width: 100%;
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }

  option { background: #1a1a3e; }
`

export default function LoginPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessType, setAccessType] = useState<'producer' | 'spector'>('producer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password, accessType)
      } else {
        await login(email, password)
      }
      router.push('/podcasts')
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Wrapper>
      <Card>
        <Title>{isRegister ? 'Create Account' : 'Sign In'}</Title>
        <Subtitle>
          {isRegister
            ? 'Register to start publishing your podcasts'
            : 'Welcome back to StellarCast'}
        </Subtitle>

        {error && <Error>{error}</Error>}

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

          <Field>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>

          {isRegister && (
            <Field>
              <Label htmlFor="access-type">Account Type</Label>
              <Select
                id="access-type"
                value={accessType}
                onChange={(e) => setAccessType(e.target.value as 'producer' | 'spector')}
              >
                <option value="producer">Producer</option>
                <option value="spector">Spector</option>
              </Select>
            </Field>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <Toggle onClick={() => setIsRegister((v) => !v)}>
          {isRegister
            ? 'Already have an account? Sign in'
            : "Don't have an account? Register"}
        </Toggle>
      </Card>
    </Wrapper>
  )
}
