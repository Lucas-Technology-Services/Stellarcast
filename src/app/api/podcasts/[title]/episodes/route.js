import { NextResponse } from 'next/server'
import { listEpisodes, createEpisode } from '@/services/podcastService'

export async function GET(_request, { params }) {
  try {
    const { title } = await params

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 },
      )
    }

    const data = await listEpisodes(title)
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

export async function POST(request, { params }) {
  try {
    const { title } = await params
    const body = await request.json()

    const { title: episodeTitle } = body

    if (!episodeTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: title' },
        { status: 400 },
      )
    }

    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userToken = authHeader.replace('Bearer ', '')
    const data = await createEpisode(title, body, userToken)

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
