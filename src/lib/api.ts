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

const CHUNK_SIZE = 5 * 1024 * 1024
const UPLOAD_CONCURRENCY = 1

async function uploadPart(
  url: string,
  chunk: Blob,
  partNumber: number,
  attempt: number = 1,
): Promise<{ PartNumber: number; ETag: string }> {
  const res = await fetch(url, { method: 'PUT', body: chunk })
  if (!res.ok) {
    if (attempt < 3) {
      const delay = Math.min(5000 * Math.pow(2, attempt - 1), 20000)
      await new Promise((r) => setTimeout(r, delay))
      return uploadPart(url, chunk, partNumber, attempt + 1)
    }
    throw new Error(`Failed to upload part ${partNumber} after 3 attempts`)
  }
  const etag = res.headers.get('ETag')
  if (!etag) {
    throw new Error(`Missing ETag for part ${partNumber}`)
  }
  return { PartNumber: partNumber, ETag: etag }
}

export async function uploadEpisodeVideo(
  episodeToken: string,
  videoFile: File,
): Promise<UploadResponse> {
  const token = await getMachineToken()
  const ext = videoFile.name.split('.').pop() || 'mp4'
  const totalSize = videoFile.size
  const partCount = Math.ceil(totalSize / CHUNK_SIZE)

  const { uploadId, key, presignedUrls } = await apiPost<{
    uploadId: string
    key: string
    presignedUrls: string[]
    partCount: number
  }>(
    `/api/episodes/${encodeURIComponent(episodeToken)}/upload`,
    {
      fileName: videoFile.name,
      contentType: videoFile.type || `video/${ext}`,
      partCount,
    },
    token,
  )

  const parts: { PartNumber: number; ETag: string }[] = []

  for (let i = 0; i < partCount; i += UPLOAD_CONCURRENCY) {
    const batch = Array.from(
      { length: Math.min(UPLOAD_CONCURRENCY, partCount - i) },
      (_, j) => {
        const partIndex = i + j
        const start = partIndex * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, totalSize)
        return uploadPart(
          presignedUrls[partIndex],
          videoFile.slice(start, end),
          partIndex + 1,
        )
      },
    )
    const results = await Promise.all(batch)
    parts.push(...results)
  }

  parts.sort((a, b) => a.PartNumber - b.PartNumber)

  _machineToken = null
  const confirmToken = await getMachineToken()
  return apiPost<UploadResponse>(
    `/api/episodes/${encodeURIComponent(episodeToken)}/confirm`,
    { key, uploadId, parts },
    confirmToken,
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
