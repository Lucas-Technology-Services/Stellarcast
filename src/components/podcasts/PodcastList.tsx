'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mic, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/UserMenu'
import { listMyPodcasts, type Podcast } from '@/lib/api'
import styled from 'styled-components'

const Wrapper = styled.div`
  min-height: 100vh;
  background: #07071a;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
`

const LogoText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 20px;

  a {
    color: #c4b5fd;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    &:hover { color: #ffffff; }
  }
`

const UserBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border: 2px solid rgba(167, 139, 250, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
`

const Content = styled.main`
  width: 100%;
  max-width: 900px;
  padding: 0 20px 60px;
`

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 8px;
`

const PageSubtitle = styled.p`
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 32px;
`

const CreateButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border-radius: 12px;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  margin-bottom: 32px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.92; }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`

const Card = styled(Link)`
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 16px;
  padding: 24px;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    border-color: rgba(124, 58, 237, 0.5);
    transform: translateY(-2px);
  }
`

const CardCover = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(10, 10, 30, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 13px;
`

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`

const CardCategory = styled.span`
  font-size: 12px;
  color: #a78bfa;
  font-weight: 500;
`

const CardDesc = styled.p`
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;

  svg { margin-bottom: 16px; opacity: 0.4; }
  p { font-size: 16px; margin-bottom: 8px; color: #94a3b8; }
  span { font-size: 13px; }
`

export default function PodcastList() {
  const router = useRouter()
  const { token, user, isLoading } = useAuth()
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login')
    }
  }, [token, isLoading, router])

  useEffect(() => {
    async function load() {
      if (!token) return
      try {
        const data = await listMyPodcasts(token)
        setPodcasts(data)
      } catch {
        setPodcasts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

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
          <Link href="/podcasts">Create Podcast</Link>
          <UserMenu />
        </Nav>
      </Header>

      <Content>
        <PageTitle>My Podcasts</PageTitle>
        <PageSubtitle>Manage your podcasts and episodes</PageSubtitle>

        <CreateButton href="/podcasts">
          <Plus size={18} />
          New Podcast
        </CreateButton>

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Loading podcasts...</p>
        ) : podcasts.length === 0 ? (
          <EmptyState>
            <Mic size={48} />
            <p>No podcasts yet</p>
            <span>Create your first podcast to get started</span>
          </EmptyState>
        ) : (
          <Grid>
            {podcasts.map((p) => (
              <Card key={p.id} href={`/podcasts/${encodeURIComponent(p.title)}/episodes`}>
                <CardCover>
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Mic size={32} />
                  )}
                </CardCover>
                <CardTitle>{p.title}</CardTitle>
                {p.category && <CardCategory>{p.category.name}</CardCategory>}
                {p.description && <CardDesc>{p.description}</CardDesc>}
              </Card>
            ))}
          </Grid>
        )}
      </Content>
    </Wrapper>
  )
}
