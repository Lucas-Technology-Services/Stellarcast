'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CirclePlay, ChevronDown } from 'lucide-react'
import {
  PageWrapper,
  BackgroundOverlay,
  Header,
  LogoWrapper,
  LogoIcon,
  LogoText,
  Nav,
  NavAvatar,
  NavCta,
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

const PRIMARY_CATEGORIES = ['Technology', 'Science', 'Business', 'True Crime', 'Comedy', 'Etc']
const EXTRA_CATEGORIES = ['Technology', 'Hoploy', 'Guity', 'Nuport', 'Homith', 'Apppre', 'Stante']

interface FormState {
  title: string
  description: string
  category: string
  coverUrl: string
  coverPreview: string | null
}

export default function CreatePodcast() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: 'Technology',
    coverUrl: '',
    coverPreview: null,
  })

  function handleCategorySelect(cat: string) {
    setForm((prev) => ({ ...prev, category: cat }))
  }

  function handleCoverUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    setForm((prev) => ({ ...prev, coverUrl: url, coverPreview: url || null }))
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, coverPreview: objectUrl, coverUrl: '' }))
  }

  function handleSaveAsDraft() {
    console.log('Save as draft:', form)
  }

  function handlePublish() {
    console.log('Publish podcast:', form)
  }

  const allCategories = showExtra
    ? [...PRIMARY_CATEGORIES, ...EXTRA_CATEGORIES]
    : PRIMARY_CATEGORIES

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
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#my-podcasts">My Podcasts</a>
          <NavAvatar aria-label="User profile" />
          <NavCta href="#">Get Started</NavCta>
        </Nav>
      </Header>

      <PageContent>
        <TitleSection>
          <TitleIconWrapper>
            <CirclePlay size={26} />
          </TitleIconWrapper>
          <PageTitle>Create New Podcast</PageTitle>
        </TitleSection>

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
            <CategoryTagsWrapper>
              {allCategories.map((cat) => (
                <CategoryTag
                  key={cat + (showExtra ? '-extra' : '')}
                  type="button"
                  $active={form.category === cat}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </CategoryTag>
              ))}
              <ExpandCategoriesButton
                type="button"
                onClick={() => setShowExtra((v) => !v)}
                aria-label={showExtra ? 'Show fewer categories' : 'Show more categories'}
              >
                <ChevronDown
                  size={16}
                  style={{ transform: showExtra ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                />
              </ExpandCategoriesButton>
            </CategoryTagsWrapper>
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
                    unoptimized={form.coverPreview.startsWith('blob:')}
                  />
                ) : (
                  <CoverPreviewPlaceholder>No image</CoverPreviewPlaceholder>
                )}
              </CoverPreview>
            </CoverImageRow>
          </FieldGroup>

          <ActionRow>
            <DraftButton type="button" onClick={handleSaveAsDraft}>
              Save as Draft
            </DraftButton>
            <PublishButton type="button" onClick={handlePublish}>
              Publish Podcast
            </PublishButton>
          </ActionRow>
        </FormCard>
      </PageContent>
    </PageWrapper>
  )
}
