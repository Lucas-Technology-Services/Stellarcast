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

export interface LoginResponse {
  token: string
  expires_at: string
  user: {
    id: string
    email: string
    access_type: 'producer' | 'viewer'
    created_at: string
    updated_at: string
  }
}

import { apiGet, apiPost, apiPut, apiDelete, apiUploadFile } from './api-client'
import { getUserData } from './auth'

export async function fetchCategories(): Promise<PodcastCategory[]> {
  const token = await getMachineToken()
  return apiGet<PodcastCategory[]>('/api/categories', token)
}

let _machineToken: string | null = null

async function getMachineToken(): Promise<string> {
  if (_machineToken) return _machineToken

  const res = await apiPost<{ token: string }>('/api/auth/token', {})
  _machineToken = res.token

  setTimeout(() => { _machineToken = null }, 100 * 1000)

  return _machineToken
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const token = await getMachineToken()
  return apiPost<LoginResponse>('/api/auth/login', { email, password }, token)
}

export async function registerUser(
  email: string,
  password: string,
  accessType: 'producer' | 'viewer',
): Promise<void> {
  const token = await getMachineToken()
  await apiPost('/api/auth/register', {
    email,
    password,
    access_type: accessType,
  }, token)
}

export async function createPodcast(
  data: { email: string; title: string; description?: string; category_name?: string; cover_image_url?: string },
): Promise<Podcast> {
  const token = await getMachineToken()
  return apiPost<Podcast>('/api/podcasts', data, token)
}

export async function listMyPodcasts(_token?: string): Promise<Podcast[]> {
  const machineToken = await getMachineToken()
  const userData = getUserData()
  const email = userData?.email ?? ''
  return apiGet<Podcast[]>(`/api/podcasts/mine?user_email=${encodeURIComponent(email)}`, machineToken)
}

export async function getPodcastByTitle(title: string): Promise<Podcast> {
  const token = await getMachineToken()
  return apiGet<Podcast>(`/api/podcasts/${encodeURIComponent(title)}`, token)
}

export async function listEpisodes(podcastTitle: string): Promise<Episode[]> {
  const token = await getMachineToken()
  return apiGet<Episode[]>(
    `/api/podcasts/${encodeURIComponent(podcastTitle)}/episodes`,
    token,
  )
}

export async function createEpisode(
  podcastTitle: string,
  data: { title: string; description?: string; duration_seconds?: number },
): Promise<Episode> {
  const token = await getMachineToken()
  return apiPost<Episode>(
    `/api/podcasts/${encodeURIComponent(podcastTitle)}/episodes`,
    data,
    token,
  )
}

export async function getEpisode(episodeToken: string): Promise<Episode> {
  const token = await getMachineToken()
  return apiGet<Episode>(`/api/episodes/${encodeURIComponent(episodeToken)}`, token)
}

export async function uploadEpisodeVideo(
  episodeToken: string,
  videoFile: File,
): Promise<UploadResponse> {
  const token = await getMachineToken()
  const formData = new FormData()
  formData.append('video', videoFile)
  return apiUploadFile<UploadResponse>(
    `/api/episodes/${encodeURIComponent(episodeToken)}/upload`,
    formData,
    token,
  )
}

export async function uploadPodcastCover(
  podcastTitle: string,
  imageFile: File,
): Promise<Podcast> {
  const token = await getMachineToken()
  const formData = new FormData()
  formData.append('image', imageFile)
  return apiUploadFile<Podcast>(
    `/api/podcasts/${encodeURIComponent(podcastTitle)}/cover`,
    formData,
    token,
  )
}

export async function uploadEpisodeThumbnail(
  episodeToken: string,
  imageFile: File,
): Promise<Episode> {
  const token = await getMachineToken()
  const formData = new FormData()
  formData.append('image', imageFile)
  return apiUploadFile<Episode>(
    `/api/episodes/${encodeURIComponent(episodeToken)}/thumbnail`,
    formData,
    token,
  )
}

export async function updateEpisode(
  episodeToken: string,
  data: { title: string; description?: string; duration_seconds?: number },
): Promise<Episode> {
  const token = await getMachineToken()
  return apiPut<Episode>(
    `/api/episodes/${encodeURIComponent(episodeToken)}`,
    data,
    token,
  )
}

export async function deleteEpisode(episodeToken: string): Promise<void> {
  const token = await getMachineToken()
  await apiDelete(
    `/api/episodes/${encodeURIComponent(episodeToken)}`,
    token,
  )
}

export interface ConsumptionInsights {
  generatedAt: string
  summary: {
    score: number
    health: 'excellent' | 'good' | 'regular' | 'poor'
    message: string
  }
  statistics: {
    podcasts: number
    episodes: number
    completions: number
    uniqueViewers: number
    averageCompletionRate: number
  }
  ranking: {
    bestEpisodes: { episodeId: string; title: string; completionRate: number; completions: number }[]
    worstEpisodes: { episodeId: string; title: string; completionRate: number; completions: number }[]
  }
  insights: { type: 'positive' | 'warning' | 'opportunity'; title: string; description: string }[]
  recommendations: { priority: 'high' | 'medium' | 'low'; title: string; description: string }[]
  executiveNarrative: string
  analyticsContext: {
    hasManyEpisodes: boolean
    hasExcellentRetention: boolean
    hasLowRetention: boolean
    growingAudience: boolean
    bestEpisode?: unknown
    worstEpisode?: unknown
  }
}

export async function fetchConsumptionInsights(email: string): Promise<ConsumptionInsights> {
  const token = await getMachineToken()
  return apiGet<ConsumptionInsights>(
    `/api/episodes/consumption-insights?email=${encodeURIComponent(email)}`,
    token,
  )
}

export async function createFeed(
  podcastId: string,
  episodeId: string,
): Promise<{ id: string }> {
  const token = await getMachineToken()
  return apiPost<{ id: string }>(
    '/api/feeds',
    { podcast_id: podcastId, episode_id: episodeId },
    token,
  )
}
