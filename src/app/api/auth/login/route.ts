import { NextResponse } from 'next/server'
import { serverPost } from '@/services/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      )
    }

    const data = await serverPost<{
      token: string
      expires_at: string
      user: { id: string; email: string; access_type: string; created_at: string; updated_at: string }
    }>('/users/login', { email, password }, { machine: true })

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
