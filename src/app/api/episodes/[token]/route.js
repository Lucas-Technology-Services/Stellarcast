import { NextResponse } from 'next/server'
import { serverGet } from '@/services/externalApi'

export async function GET(_request, { params }) {
  try {
    const { token } = await params
    const data = await serverGet(
      `/episodes/${encodeURIComponent(token)}`,
      { machine: true },
    )
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch episode'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
