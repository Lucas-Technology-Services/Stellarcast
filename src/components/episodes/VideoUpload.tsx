'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { uploadEpisodeVideo, getEpisode } from '@/lib/api'
import type { Episode } from '@/lib/api'
import {
  Wrapper,
  Header,
  LogoText,
  Nav,
  UserBadge,
  Content,
  PageTitle,
  BackLink,
  FormCard,
  FieldGroup,
  Label,
  Button,
  ErrorBox,
  SuccessBox,
} from './styles'
import Link from 'next/link'

export default function VideoUpload() {
  const router = useRouter()
  const params = useParams()
  const episodeToken = typeof params.token === 'string' ? params.token : ''
  const podcastTitle = typeof params.title === 'string' ? decodeURIComponent(params.title) : ''
  const { token, user, isLoading } = useAuth()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  useEffect(() => {
    async function load() {
      if (!episodeToken) return
      try {
        const ep = await getEpisode(episodeToken)
        setEpisode(ep)
      } catch {
        setError('Episode not found')
      }
    }
    load()
  }, [episodeToken])

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setVideoFile(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setVideoFile(file)
  }

  async function handleUpload() {
    if (!token || !episodeToken || !videoFile) return
    setError('')
    setSuccess('')
    setUploading(true)
    try {
      const result = await uploadEpisodeVideo(episodeToken, videoFile)
      setSuccess(
        'Upload queued successfully! The episode will be published automatically once processing is complete.',
      )
      if (result.player_url) {
        setSuccess((prev) => prev + `\nPlayer URL: ${result.player_url}`)
      }
      setVideoFile(null)
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (isLoading || !token) {
    return (
      <Wrapper>
        <Content style={{ textAlign: 'center', paddingTop: 80 }}>
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        </Content>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Header>
        <LogoText>StellarCast</LogoText>
        <Nav>
          <Link href="/podcasts/mine">My Podcasts</Link>
          <UserBadge as="div" title={user?.email || 'User'}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </UserBadge>
        </Nav>
      </Header>

      <Content>
        <BackLink
          href={`/podcasts/${encodeURIComponent(podcastTitle)}/episodes`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#a78bfa',
            fontSize: 13,
            textDecoration: 'none',
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} />
          Back to Episodes
        </BackLink>

        <PageTitle>Upload Video</PageTitle>
        {episode && (
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>
            Episode: {episode.title}
          </p>
        )}

        {error && <ErrorBox style={{ marginBottom: 16 }}>{error}</ErrorBox>}
        {success && <SuccessBox style={{ marginBottom: 16, whiteSpace: 'pre-line' }}>{success}</SuccessBox>}

        <FormCard>
          <FieldGroup>
            <Label>Video File (mp4 recommended)</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'rgba(124,58,237,0.8)' : 'rgba(124,58,237,0.3)'}`,
                borderRadius: 12,
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: dragOver ? 'rgba(124,58,237,0.08)' : 'rgba(10,10,30,0.5)',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              {videoFile ? (
                <div>
                  <CheckCircle size={32} style={{ color: '#22c55e', marginBottom: 8 }} />
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: 0 }}>
                    {videoFile.name}
                  </p>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload size={32} style={{ color: '#64748b', marginBottom: 8 }} />
                  <p style={{ color: '#94a3b8', margin: 0 }}>
                    Drag & drop your video here, or click to browse
                  </p>
                  <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    MP4 format recommended
                  </p>
                </div>
              )}
            </div>
          </FieldGroup>

          <Button
            type="button"
            onClick={handleUpload}
            disabled={!videoFile || uploading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload size={18} />
                Upload to YouTube
              </>
            )}
          </Button>
        </FormCard>
      </Content>
    </Wrapper>
  )
}
