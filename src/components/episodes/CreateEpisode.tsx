'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Image } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/UserMenu'
import { createEpisode, uploadEpisodeThumbnail, uploadEpisodeVideo, createFeed } from '@/lib/api'
import ThumbnailCropper from '@/components/episodes/ThumbnailCropper'
import {
  Wrapper,
  Header,
  LogoText,
  Nav,
  Content,
  PageTitle,
  BackLink,
  FormCard,
  FieldGroup,
  Label,
  Input,
  Textarea,
  Button,
  ErrorBox,
} from './styles'
import Link from 'next/link'

export default function CreateEpisode() {
  const router = useRouter()
  const params = useParams()
  const title = typeof params.title === 'string' ? decodeURIComponent(params.title) : ''
  const { token, user, isLoading } = useAuth()
  const [epTitle, setEpTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [croppingImage, setCroppingImage] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleCropComplete(blob: Blob) {
    const cropped = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
    setThumbnailFile(cropped)
    setThumbnailPreview(URL.createObjectURL(cropped))
    setCroppingImage(null)
  }

  function handleCropCancel() {
    setCroppingImage(null)
  }

  const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')

    if (videoFile && videoFile.size > MAX_VIDEO_SIZE) {
      setError('Video file exceeds the 300 MB limit')
      return
    }

    setSaving(true)
    try {
      const episode = await createEpisode(title, {
        title: epTitle,
        description: description || undefined,
        duration_seconds: duration ? parseInt(duration, 10) : undefined,
      })

      if (thumbnailFile) {
        await uploadEpisodeThumbnail(episode.masked_video_token, thumbnailFile)
          .catch(() => {})
      }

      if (videoFile) {
        await uploadEpisodeVideo(episode.masked_video_token, videoFile)
      } else {
        await createFeed(episode.podcast_id, episode.id).catch(() => {})
      }

      router.push(`/podcasts/${encodeURIComponent(title)}/episodes`)
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to create episode')
    } finally {
      setSaving(false)
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
          <UserMenu />
        </Nav>
      </Header>

      <Content>
        <BackLink
          href={`/podcasts/${encodeURIComponent(title)}/episodes`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a78bfa', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}
        >
          <ArrowLeft size={14} />
          Back to Episodes
        </BackLink>

        <PageTitle>Create Episode</PageTitle>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>
          for {decodeURIComponent(title)}
        </p>

        {error && <ErrorBox style={{ marginBottom: 16 }}>{error}</ErrorBox>}

        <FormCard as="form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Label htmlFor="ep-title">Episode Title</Label>
            <Input
              id="ep-title"
              type="text"
              placeholder="Episode title..."
              value={epTitle}
              onChange={(e) => setEpTitle(e.target.value)}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="ep-desc">Description</Label>
            <Textarea
              id="ep-desc"
              placeholder="Episode description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="ep-duration">Duration (seconds)</Label>
            <Input
              id="ep-duration"
              type="number"
              placeholder="e.g. 3600"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="ep-thumb">Thumbnail Image</Label>
            {croppingImage ? (
              <ThumbnailCropper
                file={croppingImage}
                onCrop={handleCropComplete}
                onCancel={handleCropCancel}
              />
            ) : (
              <div>
                {thumbnailPreview && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 320,
                      borderRadius: 10,
                      overflow: 'hidden',
                      marginBottom: 10,
                      border: '2px solid rgba(124,58,237,0.3)',
                    }}
                  >
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null)
                        setThumbnailPreview(null)
                      }}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                      }}
                      aria-label="Remove thumbnail"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <label
                  htmlFor="ep-thumb"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 10,
                    color: '#c4b5fd',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124,58,237,0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(124,58,237,0.12)')}
                >
                  <Image size={16} />
                  {thumbnailFile ? 'Change Thumbnail' : 'Select Thumbnail'}
                </label>
                <input
                  id="ep-thumb"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setCroppingImage(file)
                    e.target.value = ''
                  }}
                />
              </div>
            )}
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="ep-video">Video Upload (mp4, mov, avi)</Label>
            <Input
              id="ep-video"
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              style={{ padding: 8 }}
            />
          </FieldGroup>

          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Episode'}
          </Button>
        </FormCard>
      </Content>
    </Wrapper>
  )
}
