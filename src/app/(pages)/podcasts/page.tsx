import type { Metadata } from 'next'
import CreatePodcast from '@/components/podcasts/CreatePodcast'

export const metadata: Metadata = {
  title: 'Create Podcast — StellarCast',
  description: 'Create and publish a new podcast on StellarCast.',
}

export default function PodcastsPage() {
  return <CreatePodcast />
}
