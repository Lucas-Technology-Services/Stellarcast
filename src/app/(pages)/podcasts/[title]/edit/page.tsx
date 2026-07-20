import type { Metadata } from 'next'
import EditPodcast from '@/components/podcasts/EditPodcast'

export const metadata: Metadata = {
  title: 'Edit Podcast — StellarCast',
  description: 'Edit your podcast settings.',
}

export default function EditPodcastPage() {
  return <EditPodcast />
}
