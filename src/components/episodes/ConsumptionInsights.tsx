'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { fetchConsumptionInsights, type ConsumptionInsights } from '@/lib/api'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Play,
  Target,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Activity,
  RefreshCw,
  Calendar,
  Mail,
  Radio,
} from 'lucide-react'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`

const Wrapper = styled.div`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: ${fadeIn} 0.5s ease-out;
  @media (max-width: 640px) { gap: 16px; }
`

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: rgba(15, 15, 40, 0.75);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 16px;
  padding: 16px 20px;
  @media (max-width: 640px) { flex-direction: column; align-items: stretch; }
`

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  @media (max-width: 640px) { width: 100%; }
`

const FilterIcon = styled.div`
  color: #a78bfa; display: flex; align-items: center; flex-shrink: 0;
`

const FilterLabel = styled.span`
  font-size: 13px; font-weight: 600; color: #94a3b8; white-space: nowrap;
`

const EmailInput = styled.input`
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #e2e8f0;
  width: 260px;
  outline: none;
  &:focus { border-color: rgba(124, 58, 237, 0.6); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12); }
  &::placeholder { color: #475569; }
  @media (max-width: 640px) { width: 100%; }
`

const DateInput = styled.input`
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: #e2e8f0;
  width: 160px;
  outline: none;
  color-scheme: dark;
  &:focus { border-color: rgba(124, 58, 237, 0.6); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12); }
  @media (max-width: 640px) { width: 100%; }
`

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  margin-left: auto;
  &:hover { opacity: 0.92; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  @media (max-width: 640px) { margin-left: 0; width: 100%; justify-content: center; }
`

const NoteBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  padding: 6px 12px;
  background: rgba(100, 116, 139, 0.1);
  border-radius: 8px;
  width: fit-content;
`

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  @media (max-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 640px) { grid-template-columns: repeat(2, 1fr); }
`

const StatCard = styled.div<{ $accent: string; $bgAccent: string }>`
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid ${({ $bgAccent }) => $bgAccent};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px ${({ $bgAccent }) => $bgAccent.replace('0.25', '0.15')};
  }
`

const StatCardIcon = styled.div<{ $color: string }>`
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 10px;
  background: ${({ $color }) => $color.replace(')', ', 0.12)')};
`

const StatValue = styled.span<{ $accent: string }>`
  font-size: 28px; font-weight: 800; color: ${({ $accent }) => $accent}; line-height: 1;
  @media (max-width: 640px) { font-size: 22px; }
`

const StatLabel = styled.span`
  font-size: 12px; font-weight: 500; color: #94a3b8; line-height: 1.3;
`

const SectionTitle = styled.h2`
  font-size: 18px; font-weight: 700; color: #f1f5f9;
  display: flex; align-items: center; gap: 8px; margin: 0;
`

const SectionCard = styled.div`
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 16px;
  padding: 20px 24px;
  @media (max-width: 640px) { padding: 16px; }
`

const NarrativeCard = styled.div`
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(79, 70, 229, 0.08));
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  @media (max-width: 640px) { flex-direction: column; text-align: center; padding: 16px; }
`

const ScoreRing = styled.div<{ $score: number; $color: string }>`
  width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: conic-gradient(${({ $color }) => $color} ${({ $score }) => $score * 3.6}deg, rgba(124, 58, 237, 0.15) 0deg);
  position: relative;
  &::before {
    content: ''; position: absolute; width: 58px; height: 58px;
    border-radius: 50%; background: #0f0f28;
  }
`

const ScoreValue = styled.span`
  font-size: 20px; font-weight: 800; color: #f1f5f9; z-index: 1;
`

const NarrativeText = styled.p`
  font-size: 14px; color: #c4b5fd; line-height: 1.6; margin: 0; flex: 1;
`

const RankingGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`

const RankingCard = styled.div<{ $type: 'best' | 'worst' }>`
  background: rgba(15, 15, 40, 0.85);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid ${({ $type }) => $type === 'best' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};
`

const RankingHeader = styled.div<{ $type: 'best' | 'worst' }>`
  display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  font-size: 14px; font-weight: 700;
  color: ${({ $type }) => $type === 'best' ? '#22c55e' : '#ef4444'};
`

const EpisodeRow = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(10, 10, 30, 0.5);
  margin-bottom: 8px;
  transition: background 0.15s;
  &:hover { background: rgba(10, 10, 30, 0.8); }
  &:last-child { margin-bottom: 0; }
`

const RankPos = styled.span<{ $color: string }>`
  font-size: 12px; font-weight: 800; color: ${({ $color }) => $color};
  flex-shrink: 0; width: 24px;
`

const EpisodeName = styled.span`
  font-size: 13px; font-weight: 500; color: #e2e8f0;
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`

const CompletionBadge = styled.span<{ $rate: number }>`
  font-size: 12px; font-weight: 700;
  color: ${({ $rate }) => $rate >= 80 ? '#22c55e' : $rate >= 50 ? '#f59e0b' : '#ef4444'};
  background: ${({ $rate }) =>
    $rate >= 80 ? 'rgba(34,197,94,0.12)' : $rate >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'};
  padding: 3px 10px; border-radius: 9999px; white-space: nowrap; flex-shrink: 0;
`

const InsightList = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`

const InsightCard = styled.div<{ $type: 'positive' | 'warning' | 'opportunity' }>`
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid ${({ $type }) =>
    $type === 'positive' ? 'rgba(34,197,94,0.2)' : $type === 'warning' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'};
  border-radius: 14px; padding: 16px; display: flex; gap: 12px;
  transition: transform 0.2s;
  &:hover { transform: translateY(-1px); }
`

const InsightIconBox = styled.div<{ $type: 'positive' | 'warning' | 'opportunity' }>`
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: ${({ $type }) =>
    $type === 'positive' ? 'rgba(34,197,94,0.15)' : $type === 'warning' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'};
  color: ${({ $type }) =>
    $type === 'positive' ? '#22c55e' : $type === 'warning' ? '#ef4444' : '#3b82f6'};
`

const InsightContent = styled.div`flex: 1;`

const InsightTitle = styled.h4`
  font-size: 14px; font-weight: 700; color: #f1f5f9; margin: 0 0 4px;
`

const InsightDesc = styled.p`
  font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;
`

const RecList = styled.div`
  display: flex; flex-direction: column; gap: 10px;
`

const RecCard = styled.div<{ $priority: 'high' | 'medium' | 'low' }>`
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid ${({ $priority }) =>
    $priority === 'high' ? 'rgba(239,68,68,0.2)' : $priority === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)'};
  border-left: 3px solid ${({ $priority }) =>
    $priority === 'high' ? '#ef4444' : $priority === 'medium' ? '#f59e0b' : '#64748b'};
  border-radius: 12px; padding: 14px 16px;
  transition: transform 0.15s;
  &:hover { transform: translateX(2px); }
`

const RecPriority = styled.span<{ $priority: 'high' | 'medium' | 'low' }>`
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: ${({ $priority }) => $priority === 'high' ? '#ef4444' : $priority === 'medium' ? '#f59e0b' : '#64748b'};
  background: ${({ $priority }) =>
    $priority === 'high' ? 'rgba(239,68,68,0.12)' : $priority === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.12)'};
  padding: 2px 8px; border-radius: 6px; width: fit-content; margin-bottom: 4px;
`

const RecTitle = styled.h4`
  font-size: 14px; font-weight: 600; color: #f1f5f9; margin: 0 0 4px;
`

const RecDesc = styled.p`
  font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;
`

const LoadingDots = styled.div`
  display: flex; gap: 6px; align-items: center; justify-content: center; padding: 60px 0;
`

const Dot = styled.div`
  width: 10px; height: 10px; border-radius: 50%; background: #7c3aed;
  animation: ${pulse} 1.2s ease-in-out infinite;
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
`

const EmptyCard = styled.div`
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.15);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

const EmptyText = styled.p`
  font-size: 14px; color: #64748b; margin: 0;
`

const ErrorCard = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 640px) { flex-direction: column; text-align: center; }
`

const ErrorText = styled.p`
  font-size: 14px; color: #fca5a5; margin: 0; flex: 1;
`

const CardTitle = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
`

export default function ConsumptionInsights() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<ConsumptionInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInsights = useCallback(async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const result = await fetchConsumptionInsights(email)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  useEffect(() => {
    if (email) {
      loadInsights()
    } else {
      setLoading(false)
    }
  }, [email, loadInsights])

  const healthColor = (health: string) => {
    switch (health) {
      case 'excellent': return '#22c55e'
      case 'good': return '#a78bfa'
      case 'regular': return '#f59e0b'
      case 'poor': return '#ef4444'
      default: return '#64748b'
    }
  }

  if (!email && !loading) {
    return (
      <Wrapper>
        <EmptyCard>
          <Mail size={36} color="#475569" />
          <EmptyText>Sign in to view consumption insights.</EmptyText>
        </EmptyCard>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <FiltersRow>
        <FilterGroup>
          <FilterIcon><Mail size={16} /></FilterIcon>
          <FilterLabel>Email</FilterLabel>
          <EmailInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </FilterGroup>

        <FilterGroup>
          <FilterIcon><Calendar size={16} /></FilterIcon>
          <FilterLabel>From</FilterLabel>
          <DateInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>To</FilterLabel>
          <DateInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </FilterGroup>

        <RefreshButton onClick={loadInsights} disabled={loading || !email}>
          <RefreshCw size={16} />
          {loading ? 'Loading...' : 'Refresh'}
        </RefreshButton>
      </FiltersRow>

      <NoteBadge>
        <Calendar size={14} />
        Period: {startDate || '—'} to {endDate || '—'} · Date filtering will be available in a future API update
      </NoteBadge>

      {loading && (
        <LoadingDots>
          <Dot /><Dot /><Dot />
        </LoadingDots>
      )}

      {error && (
        <ErrorCard>
          <AlertTriangle size={20} color="#ef4444" />
          <ErrorText>{error}</ErrorText>
          <RefreshButton onClick={loadInsights} style={{ marginLeft: 0, padding: '8px 16px', fontSize: 13 }}>
            <RefreshCw size={14} /> Retry
          </RefreshButton>
        </ErrorCard>
      )}

      {data && data.statistics && !loading && (
        <>
          <NarrativeCard>
            <ScoreRing $score={data.summary?.score ?? 0} $color={healthColor(data.summary?.health ?? 'regular')}>
              <ScoreValue>{data.summary?.score ?? 0}</ScoreValue>
            </ScoreRing>
            <NarrativeText>{data.executiveNarrative ?? ''}</NarrativeText>
          </NarrativeCard>

          <SectionCard>
            <CardTitle>
              <SectionTitle><BarChart3 size={18} color="#a78bfa" /> Statistics</SectionTitle>
            </CardTitle>
            <StatGrid>
              <StatCard $accent="#a78bfa" $bgAccent="rgba(167,139,250,0.25)">
                <StatCardIcon $color="#a78bfa"><Radio size={18} /></StatCardIcon>
                <StatValue $accent="#a78bfa">{data.statistics?.podcasts ?? 0}</StatValue>
                <StatLabel>Podcasts</StatLabel>
              </StatCard>
              <StatCard $accent="#60a5fa" $bgAccent="rgba(96,165,250,0.25)">
                <StatCardIcon $color="#60a5fa"><Play size={18} /></StatCardIcon>
                <StatValue $accent="#60a5fa">{data.statistics?.episodes ?? 0}</StatValue>
                <StatLabel>Episodes</StatLabel>
              </StatCard>
              <StatCard $accent="#22c55e" $bgAccent="rgba(34,197,94,0.25)">
                <StatCardIcon $color="#22c55e"><Target size={18} /></StatCardIcon>
                <StatValue $accent="#22c55e">{data.statistics?.completions ?? 0}</StatValue>
                <StatLabel>Completions</StatLabel>
              </StatCard>
              <StatCard $accent="#f59e0b" $bgAccent="rgba(245,158,11,0.25)">
                <StatCardIcon $color="#f59e0b"><Users size={18} /></StatCardIcon>
                <StatValue $accent="#f59e0b">{data.statistics?.uniqueViewers ?? 0}</StatValue>
                <StatLabel>Unique Viewers</StatLabel>
              </StatCard>
              <StatCard $accent="#22d3ee" $bgAccent="rgba(34,211,238,0.25)">
                <StatCardIcon $color="#22d3ee"><Activity size={18} /></StatCardIcon>
                <StatValue $accent="#22d3ee">{typeof data.statistics?.averageCompletionRate === 'number' ? data.statistics.averageCompletionRate.toFixed(1) : '0.0'}%</StatValue>
                <StatLabel>Avg Completion Rate</StatLabel>
              </StatCard>
            </StatGrid>
          </SectionCard>

          <RankingGrid>
            <RankingCard $type="best">
              <RankingHeader $type="best"><TrendingUp size={16} /> Best Episodes</RankingHeader>
              {(!data.ranking?.bestEpisodes || data.ranking.bestEpisodes.length === 0) && (
                <EpisodeRow><EpisodeName style={{ color: '#64748b' }}>No episodes available</EpisodeName></EpisodeRow>
              )}
              {data.ranking?.bestEpisodes?.map((ep) => (
                <EpisodeRow key={ep.episodeId}>
                  <RankPos $color="#22c55e">#{data.ranking.bestEpisodes.indexOf(ep) + 1}</RankPos>
                  <EpisodeName>{ep.title}</EpisodeName>
                  <CompletionBadge $rate={ep.completionRate ?? 0}>{typeof ep.completionRate === 'number' ? ep.completionRate.toFixed(1) : '0.0'}%</CompletionBadge>
                </EpisodeRow>
              ))}
            </RankingCard>

            <RankingCard $type="worst">
              <RankingHeader $type="worst"><TrendingDown size={16} /> Worst Episodes</RankingHeader>
              {(!data.ranking?.worstEpisodes || data.ranking.worstEpisodes.length === 0) && (
                <EpisodeRow><EpisodeName style={{ color: '#64748b' }}>No episodes available</EpisodeName></EpisodeRow>
              )}
              {data.ranking?.worstEpisodes?.map((ep) => (
                <EpisodeRow key={ep.episodeId}>
                  <RankPos $color="#ef4444">#{data.ranking.worstEpisodes.indexOf(ep) + 1}</RankPos>
                  <EpisodeName>{ep.title}</EpisodeName>
                  <CompletionBadge $rate={ep.completionRate ?? 0}>{typeof ep.completionRate === 'number' ? ep.completionRate.toFixed(1) : '0.0'}%</CompletionBadge>
                </EpisodeRow>
              ))}
            </RankingCard>
          </RankingGrid>

          <SectionCard>
            <SectionTitle><Lightbulb size={18} color="#f59e0b" /> Insights</SectionTitle>
            <div style={{ height: 16 }} />
            <InsightList>
              {(!data.insights || data.insights.length === 0) && (
                <EmptyText style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 24 }}>
                  No insights available at the moment.
                </EmptyText>
              )}
              {data.insights?.map((insight, i) => (
                <InsightCard key={i} $type={insight.type}>
                  <InsightIconBox $type={insight.type}>
                    {insight.type === 'positive' ? <Sparkles size={18} /> :
                     insight.type === 'warning' ? <AlertTriangle size={18} /> :
                     <Lightbulb size={18} />}
                  </InsightIconBox>
                  <InsightContent>
                    <InsightTitle>{insight.title}</InsightTitle>
                    <InsightDesc>{insight.description}</InsightDesc>
                  </InsightContent>
                </InsightCard>
              ))}
            </InsightList>
          </SectionCard>

          <SectionCard>
            <SectionTitle><Target size={18} color="#a78bfa" /> Recommendations</SectionTitle>
            <div style={{ height: 16 }} />
            <RecList>
              {(!data.recommendations || data.recommendations.length === 0) && (
                <EmptyText>No recommendations available at the moment.</EmptyText>
              )}
              {data.recommendations?.map((rec, i) => (
                <RecCard key={i} $priority={rec.priority}>
                  <div style={{ flex: 1 }}>
                    <RecPriority $priority={rec.priority}>
                      {rec.priority === 'high' ? 'HIGH' : rec.priority === 'medium' ? 'MEDIUM' : 'LOW'}
                    </RecPriority>
                    <RecTitle>{rec.title}</RecTitle>
                    <RecDesc>{rec.description}</RecDesc>
                  </div>
                </RecCard>
              ))}
            </RecList>
          </SectionCard>
        </>
      )}
    </Wrapper>
  )
}