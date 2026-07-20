'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CirclePlay, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/UserMenu'
import { getPodcastByTitle, updatePodcast, uploadPodcastCover, fetchCategories, type PodcastCategory } from '@/lib/api'
import { ApiError } from '@/lib/api-client'
import ThumbnailCropper, { INSTAGRAM_RATIOS } from '@/components/episodes/ThumbnailCropper'
import {
  PageWrapper,
  BackgroundOverlay,
  Header,
  LogoWrapper,
  LogoIcon,
  LogoText,
  Nav,
  PageContent,
  TitleSection,
  TitleIconWrapper,
  PageTitle,
  FormCard,
  FieldGroup,
  Label,
  Input,
  Textarea,
  CategoryTagsWrapper,
  CategoryTag,
  ExpandCategoriesButton,
  CoverImageRow,
  CoverImageLeft,
  CoverImageInputRow,
  UploadButton,
  CoverPreview,
  CoverPreviewPlaceholder,
  ActionRow,
  DraftButton,
  PublishButton,
} from './styles'

export default function EditPodcast() {
  const router = useRouter()
  const params = useParams()
  const podcastTitle = typeof params.title === 'string' ? decodeURIComponent(params.title) : ''
  const { token, user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [categories, setCategories] = useState<PodcastCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesFailed, setCategoriesFailed] = useState(false)
  const [podcastLoading, setPodcastLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [croppingCover, setCroppingCover] = useState<{ file?: File; imageUrl?: string } | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    coverUrl: '',
    coverPreview: null as string | null,
    coverFile: null as File | null,
  })

  useEffect(() => {
    setMounted(true)
    if (!token) {
      router.push('/login')
    }
  }, [token, router])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!token || !podcastTitle) return
      try {
        const podcast = await getPodcastByTitle(podcastTitle)
        if (cancelled) return
        setForm({
          title: podcast.title,
          description: podcast.description || '',
          category: podcast.category?.name || '',
          coverUrl: podcast.cover_image_url || '',
          coverPreview: podcast.cover_image_url || null,
          coverFile: null,
        })
        setPodcastLoading(false)
      } catch {
        if (!cancelled) {
          setError('Podcast not found')
          setPodcastLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, podcastTitle])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const cats = await fetchCategories()
        if (cancelled) return
        setCategories(cats)
        setCategoriesLoading(false)
      } catch {
        if (!cancelled) {
          setCategories([])
          setCategoriesLoading(false)
          setCategoriesFailed(true)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function handleCategorySelect(cat: string) {
    setForm((prev) => ({ ...prev, category: cat }))
  }

  function handleCoverUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    setForm((prev) => ({ ...prev, coverUrl: url, coverPreview: url || null, coverFile: null }))
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCroppingCover({ file })
  }

  function handleCoverCropFromPreview() {
    if (!form.coverPreview) return
    setCroppingCover({ imageUrl: form.coverPreview })
  }

  function handleCoverCropComplete(blob: Blob) {
    const cropped = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
    const objectUrl = URL.createObjectURL(cropped)
    setForm((prev) => ({ ...prev, coverPreview: objectUrl, coverUrl: '', coverFile: cropped }))
    setCroppingCover(null)
  }

  function handleCoverCropCancel() {
    setCroppingCover(null)
  }

  async function savePodcast() {
    if (!token) return
    setError('')
    if (!form.title.trim()) {
      setError('Podcast title is required.')
      return
    }
    setSaving(true)
    try {
      const updated = await updatePodcast(podcastTitle, {
        title: form.title,
        description: form.description || undefined,
        category_name: form.category || undefined,
        cover_image_url: form.coverUrl || undefined,
      })

      if (form.coverFile) {
        await uploadPodcastCover(updated.title, form.coverFile)
      }

      router.push(`/podcasts/${encodeURIComponent(updated.title)}/episodes`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to update podcast')
    } finally {
      setSaving(false)
    }
  }

  const allCategories = showExtra ? categories : categories.slice(0, 6)

  if (!mounted || !token || !user) {
    return (
      <PageWrapper>
        <PageContent style={{ justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        </PageContent>
      </PageWrapper>
    )
  }

  if (podcastLoading) {
    return (
      <PageWrapper>
        <PageContent style={{ justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: '#94a3b8' }}>Loading podcast...</p>
        </PageContent>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <BackgroundOverlay />

      <Header>
        <Link href="/home" style={{ textDecoration: 'none' }}>
          <LogoWrapper>
            <LogoIcon>✦</LogoIcon>
            <LogoText>StellarCast</LogoText>
          </LogoWrapper>
        </Link>
        <Nav>
          <Link href="/podcasts/mine">My Podcasts</Link>
          <UserMenu />
        </Nav>
      </Header>

      <PageContent>
        <TitleSection>
          <TitleIconWrapper>
            <CirclePlay size={26} />
          </TitleIconWrapper>
          <PageTitle>Edit Podcast</PageTitle>
        </TitleSection>

        <Link
          href={`/podcasts/${encodeURIComponent(podcastTitle)}/episodes`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a78bfa', fontSize: 13, textDecoration: 'none', marginBottom: 16, alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={14} />
          Back to Episodes
        </Link>

        {error && (
          <div
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <FormCard>
          <FieldGroup>
            <Label htmlFor="podcast-title">Podcast Title</Label>
            <Input
              id="podcast-title"
              type="text"
              placeholder="Enter podcast title..."
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="podcast-description">Description</Label>
            <Textarea
              id="podcast-description"
              placeholder="Write a compelling description..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Category</Label>
            {categoriesLoading ? (
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Loading categories...</span>
            ) : categoriesFailed ? (
              <Input
                id="podcast-category"
                type="text"
                placeholder="Enter category name..."
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              />
            ) : (
              <CategoryTagsWrapper>
                {allCategories.map((cat) => (
                  <CategoryTag
                    key={cat.name}
                    type="button"
                    $active={form.category === cat.name}
                    onClick={() => handleCategorySelect(cat.name)}
                  >
                    {cat.name}
                  </CategoryTag>
                ))}
                {categories.length > 6 && (
                  <ExpandCategoriesButton
                    type="button"
                    onClick={() => setShowExtra((v) => !v)}
                    aria-label={showExtra ? 'Show fewer categories' : 'Show more categories'}
                  >
                    <ChevronDown
                      size={16}
                      style={{
                        transform: showExtra ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </ExpandCategoriesButton>
                )}
              </CategoryTagsWrapper>
            )}
          </FieldGroup>

          <FieldGroup>
            <Label>Cover Image</Label>
            {croppingCover ? (
              <ThumbnailCropper
                file={croppingCover.file}
                imageUrl={croppingCover.imageUrl}
                onCrop={handleCoverCropComplete}
                onCancel={handleCoverCropCancel}
                aspectRatios={INSTAGRAM_RATIOS}
                defaultRatioIndex={0}
              />
            ) : (
              <CoverImageRow>
                <CoverImageLeft>
                  <Label htmlFor="cover-url" style={{ fontWeight: 400, fontSize: '13px', color: '#94a3b8' }}>
                    Cover Image URL
                  </Label>
                  <CoverImageInputRow>
                    <Input
                      id="cover-url"
                      type="url"
                      placeholder="https://..."
                      value={form.coverUrl}
                      onChange={handleCoverUrlChange}
                      style={{ flex: 1 }}
                    />
                    <UploadButton type="button" onClick={() => fileInputRef.current?.click()}>
                      Upload Image
                    </UploadButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileSelected}
                    />
                  </CoverImageInputRow>
                </CoverImageLeft>

                <CoverPreview
                  onClick={form.coverPreview ? handleCoverCropFromPreview : undefined}
                  style={form.coverPreview ? { cursor: 'pointer' } : undefined}
                  title={form.coverPreview ? 'Click to crop cover image' : undefined}
                >
                  {form.coverPreview ? (
                    <img
                      key={form.coverPreview}
                      src={form.coverPreview}
                      alt="Podcast cover preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: form.coverFile ? 'contain' : 'cover',
                      }}
                    />
                  ) : (
                    <CoverPreviewPlaceholder>No image</CoverPreviewPlaceholder>
                  )}
                </CoverPreview>
              </CoverImageRow>
            )}
          </FieldGroup>

          <ActionRow>
            <DraftButton type="button" onClick={savePodcast} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </DraftButton>
          </ActionRow>
        </FormCard>
      </PageContent>
    </PageWrapper>
  )
}
