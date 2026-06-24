import { NextResponse } from 'next/server'
import { serverGet, serverPost } from '@/services/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ title: string }> },
) {
  try {
    const { title } = await params
    const data = await serverGet<Array<Record<string, unknown>>>(
      `/podcasts/${encodeURIComponent(title)}/episodes`,
      { machine: true },
    )
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch episodes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ title: string }> },
) {
  try {
    const { title } = await params
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userToken = authHeader.replace('Bearer ', '')
    const body = await request.json()

    const data = await serverPost<Record<string, unknown>>(
      `/podcasts/${encodeURIComponent(title)}/episodes`,
      body,
      { userToken },
    )

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create episode'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
