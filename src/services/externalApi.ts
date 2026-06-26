export async function getExternalToken() {
    const API_URL = process.env.PODCAST_BSE_URL;
    const CLIENT_ID = process.env.CLIENT_ID_1;
    const CLIENT_SECRET = process.env.SECRET_1;

    const response = await fetch(`${API_URL}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            secret: CLIENT_SECRET
        })
    });
    if (!response.ok) {
        throw new Error("Failed to authenticate with external API");
    }
    return response.json();
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
    const API_URL = process.env.PODCAST_BSE_URL
    const token = auth?.userToken || (auth?.machine ? (await getExternalToken()).token : undefined)
    const res = await fetch(`${API_URL}/api/v1${endpoint}`, { headers: buildHeaders(token) })
    return handleResponse<T>(res)
}

export async function serverPost<T>(
    endpoint: string,
    body: unknown,
    auth?: { machine?: boolean; userToken?: string },
): Promise<T> {
    const API_URL = process.env.PODCAST_BSE_URL
    const token = auth?.userToken || (auth?.machine ? (await getExternalToken()).token : undefined)
    const res = await fetch(`${API_URL}/api/v1${endpoint}`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(body),
    })
    return handleResponse<T>(res)
}