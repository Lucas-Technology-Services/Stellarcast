import { NextResponse } from 'next/server'
import { serverPost } from '@/services/externalApi'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userToken = authHeader.replace('Bearer ', '')
    const data = await serverPost<Record<string, unknown>>('/podcasts', body, { userToken })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create podcast'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
