import { NextResponse } from 'next/server'
import { serverUploadFile } from '@/services/api'

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
    const formData = await request.formData()

    const data = await serverUploadFile<Record<string, unknown>>(
      `/podcasts/${encodeURIComponent(title)}/cover`,
      formData,
      { userToken },
    )

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload cover'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
