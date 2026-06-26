import type { Metadata } from 'next'
import VideoUpload from '@/components/episodes/VideoUpload'

export const metadata: Metadata = {
  title: 'Upload Video — StellarCast',
  description: 'Upload video for your episode.',
}

export default function VideoUploadPage() {
  return <VideoUpload />
}
