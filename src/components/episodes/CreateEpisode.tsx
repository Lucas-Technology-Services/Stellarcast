'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/UserMenu'
import { createEpisode, uploadEpisodeThumbnail } from '@/lib/api'
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError('')
    setSaving(true)
    try {
      const episode = await createEpisode(title, {
        title: epTitle,
        description: description || undefined,
        duration_seconds: duration ? parseInt(duration, 10) : undefined,
      })

      if (thumbnailFile) {
        await uploadEpisodeThumbnail(episode.masked_video_token, thumbnailFile)
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
            <Input
              id="ep-thumb"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
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
