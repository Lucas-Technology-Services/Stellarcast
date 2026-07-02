'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Clock, Film } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/UserMenu'
import { listEpisodes, getPodcastByTitle, type Episode, type Podcast } from '@/lib/api'
import {
  Wrapper,
  Header,
  LogoText,
  Nav,
  Content,
  PageTitle,
  PageSubtitle,
  BackLink,
  EpisodeCard,
  EpisodeInfo,
  EpisodeTitle,
  EpisodeMeta,
  StatusBadge,
  EmptyState,
} from './styles'

export default function EpisodeList() {
  const router = useRouter()
  const params = useParams()
  const title = typeof params.title === 'string' ? decodeURIComponent(params.title) : ''
  const { token, user, isLoading } = useAuth()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  useEffect(() => {
    async function load() {
      if (!token || !title) return
      try {
        const [epData, podData] = await Promise.all([
          listEpisodes(title),
          getPodcastByTitle(title),
        ])
        setEpisodes(epData)
        setPodcast(podData)
      } catch {
        setEpisodes([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, title])

  function formatDuration(seconds?: number): string {
    if (!seconds) return '--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
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
          <Link href={`/podcasts/${encodeURIComponent(title)}/episodes/create`}>New Episode</Link>
          <UserMenu />
        </Nav>
      </Header>

      <Content>
        <BackLink href="/podcasts/mine">
          <ArrowLeft size={14} />
          Back to My Podcasts
        </BackLink>

        <PageTitle>{podcast?.title || decodeURIComponent(title)}</PageTitle>
        <PageSubtitle>
          {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
        </PageSubtitle>

        <Link
          href={`/podcasts/${encodeURIComponent(title)}/episodes/create`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            borderRadius: 12,
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <Plus size={18} />
          New Episode
        </Link>

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading episodes...</p>
        ) : episodes.length === 0 ? (
          <EmptyState>
            <Film size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No episodes yet</p>
            <span style={{ fontSize: 13 }}>Create your first episode to get started</span>
          </EmptyState>
        ) : (
          episodes.map((ep) => (
            <EpisodeCard key={ep.id}>
              <EpisodeInfo>
                <EpisodeTitle>{ep.title}</EpisodeTitle>
                <EpisodeMeta>
                  <StatusBadge $status={ep.status}>{ep.status}</StatusBadge>
                  {ep.duration_seconds ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {formatDuration(ep.duration_seconds)}
                    </span>
                  ) : null}
                  {ep.created_at && (
                    <span>{new Date(ep.created_at).toLocaleDateString()}</span>
                  )}
                </EpisodeMeta>
              </EpisodeInfo>
              {ep.status === 'pending' && (
                <Link
                  href={`/podcasts/${encodeURIComponent(title)}/episodes/${ep.masked_video_token}/upload`}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 8,
                    color: '#c4b5fd',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Upload Video
                </Link>
              )}
            </EpisodeCard>
          ))
        )}
      </Content>
    </Wrapper>
  )
}
