export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {}
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function apiGet<T>(endpoint: string, token?: string): Promise<T> {
  const res = await fetch(endpoint, { headers: authHeaders(token) })
  return handleResponse<T>(res)
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

export async function apiUploadFile<T>(
  endpoint: string,
  formData: FormData,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  })
  return handleResponse<T>(res)
}
