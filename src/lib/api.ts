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

import { apiGet, apiPost, apiUploadFile } from './api-client'

export async function fetchCategories(): Promise<PodcastCategory[]> {
  return apiGet<PodcastCategory[]>('/api/categories')
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/auth/login', { email, password })
}

export async function registerUser(
  email: string,
  password: string,
  accessType: 'producer' | 'viewer',
): Promise<void> {
  await apiPost('/api/auth/register', {
    email,
    password,
    access_type: accessType,
  })
}

export async function createPodcast(
  data: { email: string; title: string; description?: string; category_name?: string; cover_image_url?: string },
  token: string,
): Promise<Podcast> {
  return apiPost<Podcast>('/api/podcasts', data, token)
}

export async function listMyPodcasts(token: string): Promise<Podcast[]> {
  return apiGet<Podcast[]>('/api/podcasts/mine', token)
}

export async function getPodcastByTitle(title: string): Promise<Podcast> {
  return apiGet<Podcast>(`/api/podcasts/${encodeURIComponent(title)}`)
}

export async function listEpisodes(podcastTitle: string): Promise<Episode[]> {
  return apiGet<Episode[]>(
    `/api/podcasts/${encodeURIComponent(podcastTitle)}/episodes`,
  )
}

export async function createEpisode(
  podcastTitle: string,
  data: { title: string; description?: string; duration_seconds?: number },
  token: string,
): Promise<Episode> {
  return apiPost<Episode>(
    `/api/podcasts/${encodeURIComponent(podcastTitle)}/episodes`,
    data,
    token,
  )
}

export async function getEpisode(episodeToken: string): Promise<Episode> {
  return apiGet<Episode>(`/api/episodes/${encodeURIComponent(episodeToken)}`)
}

export async function uploadEpisodeVideo(
  episodeToken: string,
  videoFile: File,
  token: string,
): Promise<UploadResponse> {
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
  token: string,
): Promise<Podcast> {
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
  token: string,
): Promise<Episode> {
  const formData = new FormData()
  formData.append('image', imageFile)
  return apiUploadFile<Episode>(
    `/api/episodes/${encodeURIComponent(episodeToken)}/thumbnail`,
    formData,
    token,
  )
}
