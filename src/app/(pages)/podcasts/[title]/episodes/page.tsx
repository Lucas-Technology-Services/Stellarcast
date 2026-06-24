import type { Metadata } from 'next'
import EpisodeList from '@/components/episodes/EpisodeList'

export const metadata: Metadata = {
  title: 'Episodes — StellarCast',
  description: 'Manage episodes for your podcast.',
}

export default function EpisodesPage() {
  return <EpisodeList />
}
