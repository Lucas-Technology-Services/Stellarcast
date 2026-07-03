import { google } from 'googleapis'
import { createReadStream } from 'fs'
import { readFile } from 'fs/promises'

interface OAuthCredentials {
  client_id: string
  client_secret: string
  refresh_token: string
}

function getCredentials(): OAuthCredentials {
  const credsB64 = process.env.YOUTUBE_OAUTH_CREDENTIALS
  if (!credsB64) {
    throw new Error('YOUTUBE_OAUTH_CREDENTIALS environment variable is not set')
  }

  const creds: OAuthCredentials = JSON.parse(
    Buffer.from(credsB64, 'base64').toString('utf-8'),
  )

  if (!creds.client_id || !creds.client_secret || !creds.refresh_token) {
    throw new Error(
      'YOUTUBE_OAUTH_CREDENTIALS must contain client_id, client_secret, and refresh_token',
    )
  }

  return creds
}

export async function uploadToYouTube(
  filePath: string,
  title: string,
  description: string,
): Promise<string> {
  const creds = getCredentials()

  const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret)
  auth.setCredentials({ refresh_token: creds.refresh_token })

  const youtube = google.youtube({ version: 'v3', auth })

  const categoryId = process.env.YOUTUBE_DEFAULT_CATEGORY_ID || '22'

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        categoryId,
      },
      status: {
        privacyStatus: 'unlisted',
      },
    },
    media: {
      body: createReadStream(filePath),
    },
  })

  const videoId = response.data.id
  if (!videoId) {
    throw new Error('YouTube upload succeeded but no video ID returned')
  }

  return videoId
}

export async function setYouTubeThumbnail(
  videoId: string,
  thumbnailPath: string,
): Promise<void> {
  const creds = getCredentials()

  const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret)
  auth.setCredentials({ refresh_token: creds.refresh_token })

  const youtube = google.youtube({ version: 'v3', auth })

  await youtube.thumbnails.set({
    videoId,
    media: {
      body: createReadStream(thumbnailPath),
    },
  })
}
