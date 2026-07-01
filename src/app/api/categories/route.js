import { NextResponse } from 'next/server'
import { serverGet } from '@/services/externalApi'

export async function GET() {
  try {
    const data = await serverGet('/categories', { machine: true })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
