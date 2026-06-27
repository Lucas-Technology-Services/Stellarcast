import { NextResponse } from 'next/server'
import { listMyPodcasts } from '@/services/podcastService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const producerEmail = searchParams.get('producer_email')
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userToken = authHeader.replace('Bearer ', '')
    const data = await listMyPodcasts(userToken, producerEmail ?? undefined)

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('401')) {
      return NextResponse.json(
        { error: 'Unauthorized', details: message },
        { status: 401 },
      )
    }

    if (message.includes('404')) {
      return NextResponse.json(
        { error: 'Not Found', details: message },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 },
    )
  }
}
