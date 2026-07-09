'use client'

import React from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import ConsumptionInsights from '@/components/episodes/ConsumptionInsights'

const PageWrapper = styled.div`
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

const Content = styled.main`
  width: 100%;
  max-width: 960px;
  padding: 0 20px 60px;
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a78bfa;
  font-size: 13px;
  text-decoration: none;
  margin-bottom: 16px;
  &:hover { color: #c4b5fd; }
`

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
`

const PageSubtitle = styled.p`
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 24px;
`

export default function InsightsPage() {
  return (
    <PageWrapper>
      <Header>
        <Link href="/podcasts/mine" style={{ textDecoration: 'none' }}>
          <LogoText>StellarCast</LogoText>
        </Link>
        <Nav>
          <Link href="/podcasts/mine">My Podcasts</Link>
          <UserMenu />
        </Nav>
      </Header>
      <Content>
        <BackLink href="/podcasts/mine">
          <ArrowLeft size={16} /> Back to My Podcasts
        </BackLink>
        <PageTitle>
          <BarChart3 size={28} color="#a78bfa" />
          Consumption Insights
        </PageTitle>
        <PageSubtitle>
          Frequency and retention analysis of viewers who watch your podcast episodes
        </PageSubtitle>
        <ConsumptionInsights />
      </Content>
    </PageWrapper>
  )
}