'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Film } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { apiGet, apiPost } from '@/lib/api-client'

interface EpisodeData {
  id: string
  title: string
  description: string
  thumbnail_url: string
  duration_seconds: number
  published_at: string
  status: string
  masked_video_token: string
}

interface PlayerResponse {
  episode: EpisodeData
  video_url: string | null
}

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const tokenParam = typeof params.token === 'string' ? params.token : ''
  const [data, setData] = useState<PlayerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!token) return
    async function load() {
      try {
        const { token: machineToken } = await apiPost<{ token: string }>('/api/auth/token', {})
        const res = await apiGet<PlayerResponse>(`/api/player/${encodeURIComponent(tokenParam)}`, machineToken)
        setData(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load episode')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, tokenParam])

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#07071a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Please sign in to watch</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07071a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#07071a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: '#fca5a5' }}>{error || 'Episode not found'}</p>
        <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid #7c3aed', color: '#c4b5fd', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07071a', color: '#fff' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>StellarCast</span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/home" style={{ color: '#c4b5fd', textDecoration: 'none', fontSize: 14 }}>Home</a>
        </nav>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px 60px' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a78bfa', fontSize: 13, textDecoration: 'none', marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{data.episode.title}</h1>
        {data.episode.description && (
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>{data.episode.description}</p>
        )}

        {data.video_url ? (
          <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: '#000', marginBottom: 24 }}>
            <video
              ref={videoRef}
              src={data.video_url}
              controls
              poster={data.episode.thumbnail_url || undefined}
              style={{ width: '100%', display: 'block', maxHeight: '70vh' }}
              playsInline
              onError={() => setVideoError(true)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 16,
              overflow: 'hidden',
              background: data.episode.thumbnail_url
                ? `url(${data.episode.thumbnail_url}) center/cover`
                : 'linear-gradient(135deg, #1e1b4b, #312e81)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(0,0,0,0.5)',
                padding: 32,
                borderRadius: 16,
              }}
            >
              <Film size={48} style={{ color: 'rgba(100,116,139,0.6)' }} />
              <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
                No video available yet
              </p>
            </div>
          </div>
        )}
        {videoError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
              padding: 12,
              marginBottom: 24,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onClick={() => setVideoError(false)}
          >
            <Play size={16} style={{ color: '#fca5a5' }} />
            <span style={{ color: '#fca5a5', fontSize: 13 }}>Video failed to load — click to retry</span>
          </div>
        )}

        {data.episode.duration_seconds > 0 && (
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Duration: {Math.floor(data.episode.duration_seconds / 60)} min {data.episode.duration_seconds % 60} sec
          </p>
        )}
      </main>
    </div>
  )
}
