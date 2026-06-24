import { NextResponse } from 'next/server'
import { serverGet } from '@/services/api'

export async function GET() {
  try {
    const data = await serverGet<
      Array<{ id: string; name: string; description: string; created_at: string; updated_at: string }>
    >('/categories', { machine: true })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
