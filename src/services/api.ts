import 'server-only'

const API_URL = process.env.API_URL

if (!API_URL) {
  throw new Error('API_URL environment variable is not set')
}

let cachedMachineToken: string | null = null

async function getMachineToken(): Promise<string> {
  if (cachedMachineToken) return cachedMachineToken
  const res = await fetch(`${API_URL}/auth/token`, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Failed to obtain machine token: ${res.status}`)
  }
  const data: { token: string } = await res.json()
  cachedMachineToken = data.token
  return data.token
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {}
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function serverGet<T>(
  endpoint: string,
  auth?: { machine?: boolean; userToken?: string },
): Promise<T> {
  const token = auth?.userToken || (auth?.machine ? await getMachineToken() : undefined)
  const res = await fetch(`${API_URL}${endpoint}`, { headers: buildHeaders(token) })
  return handleResponse<T>(res)
}

export async function serverPost<T>(
  endpoint: string,
  body: unknown,
  auth?: { machine?: boolean; userToken?: string },
): Promise<T> {
  const token = auth?.userToken || (auth?.machine ? await getMachineToken() : undefined)
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

export async function serverUploadFile<T>(
  endpoint: string,
  formData: FormData,
  auth?: { machine?: boolean; userToken?: string },
): Promise<T> {
  const token = auth?.userToken || (auth?.machine ? await getMachineToken() : undefined)
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  return handleResponse<T>(res)
}
