import { NextResponse } from 'next/server'
import { createPodcast } from '@/services/podcastService'

export async function POST(request) {
  try {
    const body = await request.json()

    const { title, category_name } = body

    if (!title || !category_name) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category_name' },
        { status: 400 },
      )
    }

    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userToken = authHeader.replace('Bearer ', '')
    const data = await createPodcast(body, userToken)

    return NextResponse.json(data, { status: 201 })
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
