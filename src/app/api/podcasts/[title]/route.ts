import { NextResponse } from 'next/server'
import { serverGet } from '@/services/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ title: string }> },
) {
  try {
    const { title } = await params
    const data = await serverGet<Record<string, unknown>>(
      `/podcasts/${encodeURIComponent(title)}`,
      { machine: true },
    )
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch podcast'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
