'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CirclePlay, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { createPodcast, uploadPodcastCover, fetchCategories, type PodcastCategory } from '@/lib/api'
import { ApiError } from '@/lib/api-client'
import {
  PageWrapper,
  BackgroundOverlay,
  Header,
  LogoWrapper,
  LogoIcon,
  LogoText,
  Nav,
  NavAvatar,
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

interface FormState {
  title: string
  description: string
  category: string
  coverUrl: string
  coverPreview: string | null
  coverFile: File | null
}

export default function CreatePodcast() {
  const router = useRouter()
  const { token, user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [categories, setCategories] = useState<PodcastCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesFailed, setCategoriesFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: '',
    coverUrl: '',
    coverPreview: null,
    coverFile: null,
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
      try {
        const cats = await fetchCategories()
        if (cancelled) return
        setCategories(cats)
        setCategoriesLoading(false)
        if (cats.length > 0) {
          setForm((prev) => prev.category ? prev : { ...prev, category: cats[0].name })
        } else {
          setCategoriesFailed(true)
        }
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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, coverPreview: objectUrl, coverUrl: '', coverFile: file }))
  }

  async function savePodcast() {
    if (!token) return
    setError('')
    if (!form.title.trim()) {
      setError('Podcast title is required.')
      return
    }
    if (!form.category.trim()) {
      setError('Please select or enter a category.')
      return
    }
    setSaving(true)
    try {
      const podcast = await createPodcast(
        {
          email: user!.email,
          title: form.title,
          description: form.description || undefined,
          category_name: form.category || undefined,
          cover_image_url: form.coverUrl || undefined,
        },
        token,
      )

      if (form.coverFile) {
        await uploadPodcastCover(podcast.title, form.coverFile, token)
      }

      router.push(`/podcasts/${encodeURIComponent(podcast.title)}/episodes`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to save podcast')
    } finally {
      setSaving(false)
    }
  }

  function handleSaveAsDraft() {
    savePodcast()
  }

  function handlePublish() {
    savePodcast()
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
          <NavAvatar
            as="div"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: '2px solid rgba(167, 139, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
            }}
            title={user?.email || 'User'}
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </NavAvatar>
        </Nav>
      </Header>

      <PageContent>
        <TitleSection>
          <TitleIconWrapper>
            <CirclePlay size={26} />
          </TitleIconWrapper>
          <PageTitle>Create New Podcast</PageTitle>
        </TitleSection>

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
                    onChange={handleFileUpload}
                  />
                </CoverImageInputRow>
              </CoverImageLeft>

              <CoverPreview>
                {form.coverPreview ? (
                  <Image
                    src={form.coverPreview}
                    alt="Podcast cover preview"
                    width={120}
                    height={120}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    unoptimized
                  />
                ) : (
                  <CoverPreviewPlaceholder>No image</CoverPreviewPlaceholder>
                )}
              </CoverPreview>
            </CoverImageRow>
          </FieldGroup>

          <ActionRow>
            <DraftButton type="button" onClick={handleSaveAsDraft} disabled={saving}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </DraftButton>
            <PublishButton type="button" onClick={handlePublish} disabled={saving}>
              {saving ? 'Saving...' : 'Publish Podcast'}
            </PublishButton>
          </ActionRow>
        </FormCard>
      </PageContent>
    </PageWrapper>
  )
}
