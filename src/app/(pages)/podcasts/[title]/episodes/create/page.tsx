import type { Metadata } from 'next'
import CreateEpisode from '@/components/episodes/CreateEpisode'

export const metadata: Metadata = {
  title: 'Create Episode — StellarCast',
  description: 'Create a new episode for your podcast.',
}

export default function CreateEpisodePage() {
  return <CreateEpisode />
}
