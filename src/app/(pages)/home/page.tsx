'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import bgImage from '@/app/assets/background_img.jpg'
import { Mic, BarChart3, Globe, Upload, Share2, Headphones, Play } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import UserMenu from '@/components/UserMenu'
import { apiGet, apiPost } from '@/lib/api-client'
import {
  Page,
  Header,
  Logo,
  LogoIcon,
  LogoText,
  Nav,
  NavCta,
  Hero,
  Overlay,
  HeroContent,
  Badge,
  HeroTitle,
  GradientText,
  HeroSubtitle,
  HeroButtons,
  PrimaryBtn,
  SecondaryBtn,
  HeroStats,
  Stat,
  StatNumber,
  StatLabel,
  ScrollIndicator,
  ScrollArrow,
  FeaturesSection,
  SectionHeader,
  SectionBadge,
  SectionTitle,
  SectionDesc,
  FeaturesGrid,
  FeatureCard,
  FeatureIcon,
  FeatureTitle,
  FeatureDesc,
  HowItWorksSection,
  StepsGrid,
  StepCard,
  StepNumber,
  StepTitle,
  StepDesc,
  CtaSection,
  CtaContent,
  CtaTitle,
  CtaDesc,
  CtaButtons,
  CtaFootnote,
  Footer,
  FooterContent,
  FooterBrand,
  FooterLogoText,
  FooterDesc,
  FooterLinks,
  FooterCol,
  FooterBottom,
} from './styles'

const features = [
  {
    icon: Upload,
    title: 'Unlimited Hosting',
    desc: 'Upload hours of content with no storage limits. High-quality audio preserved.',
  },
  {
    icon: BarChart3,
    title: 'Powerful Analytics',
    desc: 'Track listens, demographics, and engagement with real-time dashboard insights.',
  },
  {
    icon: Globe,
    title: 'Global Distribution',
    desc: 'Publish to Spotify, Apple Podcasts, Google, and 20+ platforms with one click.',
  },
  {
    icon: Mic,
    title: 'Studio-Quality Recording',
    desc: 'Record and edit directly in your browser with built-in professional tools.',
  },
  {
    icon: Share2,
    title: 'Smart Monetization',
    desc: 'Earn from ads, sponsorships, and listener subscriptions — all in one place.',
  },
  {
    icon: Headphones,
    title: 'Listener Community',
    desc: 'Build a dedicated audience with comments, polls, and exclusive content.',
  },
]

const steps = [
  { num: '01', title: 'Create Your Show', desc: 'Set up your podcast in minutes. Add artwork, description, and your unique voice.' },
  { num: '02', title: 'Upload & Edit', desc: 'Drag, drop, and polish your episodes with our web-based audio editor.' },
  { num: '03', title: 'Publish Everywhere', desc: 'Distribute to all major platforms automatically. Reach listeners worldwide.' },
  { num: '04', title: 'Grow & Earn', desc: 'Track performance, engage your audience, and turn your passion into revenue.' },
]

interface FeedItem {
  id: string
  podcast_id: string
  episode_id: string
  podcast_title: string
  podcast_cover_url: string
  episode_title: string
  episode_token: string
  episode_thumbnail: string
  producer_email: string
  created_at: string
}

export default function HomePage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [feeds, setFeeds] = useState<FeedItem[]>([])
  const [feedsLoading, setFeedsLoading] = useState(true)

  useEffect(() => {
    async function loadFeeds() {
      try {
        const { token: machineToken } = await apiPost<{ token: string }>('/api/auth/token', {})
        const data = await apiGet<FeedItem[]>('/api/feeds', machineToken)
        setFeeds(data)
      } catch {
        
      } finally {
        setFeedsLoading(false)
      }
    }
    loadFeeds()
  }, [])

  return (
    <Page>
      <Header>
        <Link href="/home" style={{ textDecoration: 'none' }}>
          <Logo>
            <LogoIcon>✦</LogoIcon>
            <LogoText>StellarCast</LogoText>
          </Logo>
        </Link>
        <Nav>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          {token && user ? (
            <NavCta href="/podcasts/mine">Dashboard</NavCta>
          ) : (
            <NavCta href="#cta">Get Started</NavCta>
          )}
          {token && user ? <UserMenu /> : <a href="/login">Login</a>}
        </Nav>
      </Header>

      <Hero>
        <Image
          src={bgImage}
          alt=""
          fill
          preload
          style={{ objectFit: 'cover' }}
        />
        <Overlay />
        <HeroContent>
          <Badge>The Podcast Platform</Badge>
          <HeroTitle>
            Your Voice,{' '}
            <GradientText>The Universe</GradientText> Listens
          </HeroTitle>
          <HeroSubtitle>
            Create, distribute, and grow your podcast with StellarCast.
            Professional tools, unlimited hosting, and a global audience waiting for you.
          </HeroSubtitle>
          <HeroButtons>
            <PrimaryBtn href="#cta">Start Your Journey</PrimaryBtn>
            <SecondaryBtn href="#features">Explore Features</SecondaryBtn>
          </HeroButtons>
          <HeroStats>
            <Stat>
              <StatNumber>50K+</StatNumber>
              <StatLabel>Podcasters</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>2M+</StatNumber>
              <StatLabel>Episodes</StatLabel>
            </Stat>
            <Stat>
              <StatNumber>190+</StatNumber>
              <StatLabel>Countries</StatLabel>
            </Stat>
          </HeroStats>
        </HeroContent>
        <ScrollIndicator>
          <span>Scroll to explore</span>
          <ScrollArrow />
        </ScrollIndicator>
      </Hero>

      <section style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        {feedsLoading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p>
        ) : feeds.length === 0 ? null : (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Latest Episodes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  onClick={() => router.push(token ? `/watch/${feed.episode_token}` : '/login')}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      background: 'rgba(15, 15, 40, 0.85)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                      borderRadius: 16,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s, transform 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        background: feed.podcast_cover_url
                          ? `url(${feed.podcast_cover_url}) center/cover`
                          : 'linear-gradient(135deg, #1e1b4b, #312e81)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!feed.podcast_cover_url && (
                        <Play size={40} style={{ color: 'rgba(167, 139, 250, 0.4)' }} />
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>{feed.episode_title}</p>
                      <p style={{ fontSize: 13, color: '#a78bfa', marginBottom: 2 }}>{feed.podcast_title}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{feed.producer_email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <FeaturesSection id="features">
        <SectionHeader>
          <SectionBadge>Why StellarCast</SectionBadge>
          <SectionTitle>
            Everything You Need to <GradientText>Shine</GradientText>
          </SectionTitle>
          <SectionDesc>
            From recording to monetization, we provide the tools to turn your podcast into a success story.
          </SectionDesc>
        </SectionHeader>
        <FeaturesGrid>
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <FeatureCard key={feat.title}>
                <FeatureIcon>
                  <Icon size={28} />
                </FeatureIcon>
                <FeatureTitle>{feat.title}</FeatureTitle>
                <FeatureDesc>{feat.desc}</FeatureDesc>
              </FeatureCard>
            )
          })}
        </FeaturesGrid>
      </FeaturesSection>

      <HowItWorksSection id="how-it-works">
        <SectionHeader>
          <SectionBadge>Simple Process</SectionBadge>
          <SectionTitle>
            Start in <GradientText>4 Steps</GradientText>
          </SectionTitle>
          <SectionDesc>
            Getting your podcast online has never been easier.
          </SectionDesc>
        </SectionHeader>
        <StepsGrid>
          {steps.map((step) => (
            <StepCard key={step.num}>
              <StepNumber>{step.num}</StepNumber>
              <StepTitle>{step.title}</StepTitle>
              <StepDesc>{step.desc}</StepDesc>
            </StepCard>
          ))}
        </StepsGrid>
      </HowItWorksSection>

      <CtaSection id="cta">
        <CtaContent>
          <CtaTitle>Ready to Launch Your Podcast?</CtaTitle>
          <CtaDesc>
            Join thousands of podcasters who trust StellarCast. Start free, upgrade when you grow.
          </CtaDesc>
          <CtaButtons>
            <PrimaryBtn href="#">Get Started Free</PrimaryBtn>
            <SecondaryBtn href="#">View Pricing</SecondaryBtn>
          </CtaButtons>
          <CtaFootnote>No credit card required • Cancel anytime</CtaFootnote>
        </CtaContent>
      </CtaSection>

      <Footer>
        <FooterContent>
          <FooterBrand>
            <LogoIcon>✦</LogoIcon>
            <FooterLogoText>StellarCast</FooterLogoText>
            <FooterDesc>Empowering voices to reach the stars.</FooterDesc>
          </FooterBrand>
          <FooterLinks>
            <FooterCol>
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Integrations</a>
              <a href="#">Changelog</a>
            </FooterCol>
            <FooterCol>
              <h4>Resources</h4>
              <a href="#">Blog</a>
              <a href="#">Help Center</a>
              <a href="#">Community</a>
              <a href="#">API Docs</a>
            </FooterCol>
            <FooterCol>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </FooterCol>
          </FooterLinks>
        </FooterContent>
        <FooterBottom>
          <p>&copy; 2026 StellarCast. All rights reserved.</p>
        </FooterBottom>
      </Footer>
    </Page>
  )
}
