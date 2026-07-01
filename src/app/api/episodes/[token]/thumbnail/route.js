import { NextResponse } from 'next/server'
import { serverUploadFile } from '@/services/api'

export async function POST(request, { params }) {
  try {
    const { token } = await params
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userToken = authHeader.replace('Bearer ', '')
    const formData = await request.formData()

    const data = await serverUploadFile(
      `/episodes/${encodeURIComponent(token)}/thumbnail`,
      formData,
      { userToken },
    )

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload thumbnail'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
