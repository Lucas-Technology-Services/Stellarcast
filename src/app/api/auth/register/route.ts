import { NextResponse } from 'next/server'
import { serverPost } from '@/services/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, access_type } = body

    if (!email || !password || !access_type) {
      return NextResponse.json(
        { error: 'Email, password, and access_type are required' },
        { status: 400 },
      )
    }

    const data = await serverPost<{ id: string; email: string; access_type: string; created_at: string; updated_at: string }>(
      '/users/register',
      { email, password, access_type },
      { machine: true },
    )

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
