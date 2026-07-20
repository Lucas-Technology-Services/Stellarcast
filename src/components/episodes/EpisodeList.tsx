'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Clock, Film, Pencil, Trash2, X, Check, Play } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/UserMenu'
import {
  listEpisodes,
  getPodcastByTitle,
  updateEpisode,
  deleteEpisode,
  type Episode,
  type Podcast,
} from '@/lib/api'
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
  EditForm,
  EditInput,
  EditTextarea,
  ActionsRow,
  IconButton,
  DangerButton,
  ConfirmGroup,
  ConfirmButton,
  CancelButton,
  PreviewThumb,
  PlayOverlay,
} from './styles'

export default function EpisodeList() {
  const router = useRouter()
  const params = useParams()
  const title = typeof params.title === 'string' ? decodeURIComponent(params.title) : ''
  const { token, user, isLoading } = useAuth()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDuration, setEditDuration] = useState('')

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

  function startEdit(ep: Episode) {
    setEditingId(ep.id)
    setEditTitle(ep.title)
    setEditDescription(ep.description || '')
    setEditDuration(ep.duration_seconds ? String(ep.duration_seconds) : '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditDuration('')
  }

  async function handleSave(ep: Episode) {
    if (!token) return
    setSavingId(ep.id)
    try {
      const updated = await updateEpisode(ep.masked_video_token, {
        title: editTitle,
        description: editDescription || undefined,
        duration_seconds: editDuration ? parseInt(editDuration, 10) : undefined,
      })
      setEpisodes((prev) => prev.map((e) => (e.id === ep.id ? { ...e, ...updated } : e)))
      cancelEdit()
    } catch {
      // keep form open on error
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(ep: Episode) {
    if (!token) return
    try {
      await deleteEpisode(ep.masked_video_token)
      setEpisodes((prev) => prev.filter((e) => e.id !== ep.id))
      setDeletingId(null)
    } catch {
      // keep confirmation on error
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

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
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
            }}
          >
            <Plus size={18} />
            New Episode
          </Link>
          <Link
            href={`/podcasts/${encodeURIComponent(title)}/edit`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 12,
              color: '#c4b5fd',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <Pencil size={18} />
            Edit Podcast
          </Link>
        </div>

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
              {editingId === ep.id ? (
                <EditForm>
                  <EditInput
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Episode title"
                    required
                  />
                  <EditTextarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Episode description"
                  />
                  <EditInput
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="Duration (seconds)"
                  />
                  <ActionsRow>
                    <IconButton
                      onClick={() => handleSave(ep)}
                      disabled={savingId === ep.id || !editTitle.trim()}
                      title="Save"
                    >
                      <Check size={16} />
                      {savingId === ep.id ? 'Saving...' : 'Save'}
                    </IconButton>
                    <CancelButton onClick={cancelEdit} disabled={savingId === ep.id}>
                      <X size={16} />
                      Cancel
                    </CancelButton>
                  </ActionsRow>
                </EditForm>
              ) : (
                <>
                  <EpisodeInfo>
                    <EpisodeTitle>{ep.title}</EpisodeTitle>
                    {ep.description && (
                      <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 4px' }}>
                        {ep.description}
                      </p>
                    )}
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
                  {ep.status === 'published' && (
                    <Link
                      href={`/watch/${ep.masked_video_token}`}
                      style={{ textDecoration: 'none', flexShrink: 0 }}
                    >
                      <PreviewThumb $hasThumb={!!ep.thumbnail_url} $thumb={ep.thumbnail_url}>
                        <PlayOverlay>
                          <Play size={24} />
                        </PlayOverlay>
                      </PreviewThumb>
                    </Link>
                  )}
                  <ActionsRow>
                    <IconButton onClick={() => startEdit(ep)} title="Edit">
                      <Pencil size={14} />
                      Edit
                    </IconButton>
                    {deletingId === ep.id ? (
                      <ConfirmGroup>
                        <ConfirmButton onClick={() => handleDelete(ep)}>
                          <Check size={14} />
                          Confirm
                        </ConfirmButton>
                        <CancelButton onClick={() => setDeletingId(null)}>
                          <X size={14} />
                        </CancelButton>
                      </ConfirmGroup>
                    ) : (
                      <DangerButton onClick={() => setDeletingId(ep.id)} title="Delete">
                        <Trash2 size={14} />
                        Delete
                      </DangerButton>
                    )}
                    {ep.status === 'pending' && (
                      <Link
                        href={`/podcasts/${encodeURIComponent(title)}/episodes/${ep.masked_video_token}/upload`}
                        style={{
                          padding: '6px 14px',
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
                  </ActionsRow>
                </>
              )}
            </EpisodeCard>
          ))
        )}
      </Content>
    </Wrapper>
  )
}
