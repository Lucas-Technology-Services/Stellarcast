import type { Metadata } from 'next'
import PodcastList from '@/components/podcasts/PodcastList'

export const metadata: Metadata = {
  title: 'My Podcasts — StellarCast',
  description: 'Manage your podcasts on StellarCast.',
}

export default function MyPodcastsPage() {
  return <PodcastList />
}
