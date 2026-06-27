import { serverGet, serverPost, getExternalToken } from './externalApi'

export interface PodcastCategory {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Podcast {
  id: string
  producer_id: string
  podcast_category_id: string
  title: string
  description: string
  cover_image_url: string
  category: PodcastCategory
  created_at: string
  updated_at: string
}

export interface Episode {
  id: string
  podcast_id: string
  title: string
  description: string
  masked_video_token: string
  status: 'pending' | 'processing' | 'published' | 'failed'
  duration_seconds: number
  thumbnail_url: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface UploadResponse {
  message: string
  status: string
  episode: Episode
  player_url: string
}

export async function fetchCategories(): Promise<PodcastCategory[]> {
  return serverGet<PodcastCategory[]>('/categories', { machine: true })
}

export async function createPodcast(
  data: {
    title: string
    description?: string
    category_name?: string
    cover_image_url?: string
  },
  userToken: string,
): Promise<Podcast> {
  return serverPost<Podcast>('/podcasts', data, { userToken })
}

export async function listMyPodcasts(
  userToken: string,
  producerEmail?: string,
): Promise<Podcast[]> {
  const query = producerEmail ? `?producer_email=${encodeURIComponent(producerEmail)}` : ''
  return serverGet<Podcast[]>(`/podcasts/mine${query}`, { userToken })
}

export async function getPodcastByTitle(title: string): Promise<Podcast> {
  return serverGet<Podcast>(`/podcasts/${encodeURIComponent(title)}`, { machine: true })
}

export async function uploadPodcastCover(
  title: string,
  formData: FormData,
  userToken: string,
): Promise<Podcast> {
  return serverUploadFile<Podcast>(`/podcasts/${encodeURIComponent(title)}/cover`, formData, { userToken })
}

export async function listEpisodes(podcastTitle: string): Promise<Episode[]> {
  return serverGet<Episode[]>(`/podcasts/${encodeURIComponent(podcastTitle)}/episodes`, { machine: true })
}

export async function createEpisode(
  podcastTitle: string,
  data: {
    title: string
    description?: string
    duration_seconds?: number
  },
  userToken: string,
): Promise<Episode> {
  return serverPost<Episode>(`/podcasts/${encodeURIComponent(podcastTitle)}/episodes`, data, { userToken })
}

export async function getEpisode(episodeToken: string): Promise<Episode> {
  return serverGet<Episode>(`/episodes/${encodeURIComponent(episodeToken)}`, { machine: true })
}

export async function uploadEpisodeVideo(
  episodeToken: string,
  formData: FormData,
  userToken: string,
): Promise<UploadResponse> {
  return serverUploadFile<UploadResponse>(
    `/episodes/${encodeURIComponent(episodeToken)}/upload`,
    formData,
    { userToken },
  )
}

export async function uploadEpisodeThumbnail(
  episodeToken: string,
  formData: FormData,
  userToken: string,
): Promise<Episode> {
  return serverUploadFile<Episode>(
    `/episodes/${encodeURIComponent(episodeToken)}/thumbnail`,
    formData,
    { userToken },
  )
}

async function serverUploadFile<T>(
  endpoint: string,
  formData: FormData,
  auth?: { machine?: boolean; userToken?: string },
): Promise<T> {
  
  const API_URL = process.env.PODCAST_BSE_URL;

  if (!API_URL) {
    throw new Error('Missing PODCAST_BSE_URL')
  }

  let token: string | undefined
  if (auth?.userToken) {
    token = auth.userToken
  } else if (auth?.machine) {
    const tokenData = await getExternalToken()
    token = tokenData.token
  }

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (response.status === 401) {
    throw new Error('401 Unauthorized')
  }

  if (response.status === 404) {
    throw new Error('404 Not Found')
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`External API error: ${response.status} - ${text}`)
  }

  if (response.status === 204) return undefined as T

  return response.json()
}
