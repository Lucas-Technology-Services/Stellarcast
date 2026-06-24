import { NextResponse } from 'next/server'
import { serverGet } from '@/services/api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const producerEmail = searchParams.get('producer_email')
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userToken = authHeader.replace('Bearer ', '')
    const query = producerEmail ? `?producer_email=${encodeURIComponent(producerEmail)}` : ''

    const data = await serverGet<Array<Record<string, unknown>>>(`/podcasts/mine${query}`, { userToken })

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch podcasts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
