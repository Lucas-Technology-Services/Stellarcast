import { Pool } from 'pg'

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })
  }
  return _pool
}

export interface PodcastFeedData {
  title: string
  description: string
  coverImageUrl: string
  producerEmail: string
  categoryName: string
}

export interface EpisodeFeedData {
  title: string
  description: string
  token: string
  duration: string
  thumbnailUrl: string
  pubDate: string
}

export async function resolvePodcastBySlug(slug: string): Promise<string> {
  const result = await getPool().query(
    `SELECT id FROM public.podcasts
     WHERE (LOWER(title) = LOWER($1)
            OR LOWER(REPLACE(title, ' ', '-')) = LOWER($1))
       AND deleted_at IS NULL
     LIMIT 1`,
    [slug.trim()],
  )

  if (result.rows.length === 0) {
    throw new Error('podcast not found')
  }

  return result.rows[0].id
}

export async function getFeedData(
  podcastId: string,
): Promise<{ podcast: PodcastFeedData; episodes: EpisodeFeedData[] }> {
  const podcastResult = await getPool().query(
    `SELECT p.title, p.description, p.cover_image_url,
            u.email,
            pc.name
     FROM public.podcasts p
     JOIN public.users u ON u.id = p.user_id
     LEFT JOIN public.podcast_categories pc ON pc.id = p.podcast_category_id
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [podcastId],
  )

  if (podcastResult.rows.length === 0) {
    throw new Error('podcast not found')
  }

  const row = podcastResult.rows[0]
  const podcast: PodcastFeedData = {
    title: row.title,
    description: row.description || '',
    coverImageUrl:
      row.cover_image_url && !row.cover_image_url.startsWith('data:')
        ? row.cover_image_url
        : '',
    producerEmail: row.email,
    categoryName: row.name || '',
  }

  const episodesResult = await getPool().query(
    `SELECT title, description, masked_video_token,
            duration_seconds, thumbnail_url, published_at
     FROM public.episodes
     WHERE podcast_id = $1
       AND status = 'published'
       AND deleted_at IS NULL
     ORDER BY published_at DESC`,
    [podcastId],
  )

  const episodes: EpisodeFeedData[] = episodesResult.rows.map(
    (ep: Record<string, unknown>) => ({
      title: ep.title as string,
      description: (ep.description as string) || '',
      token: (ep.masked_video_token as string) || '',
      duration:
        (ep.duration_seconds as number) > 0
          ? formatDurationHMS(ep.duration_seconds as number)
          : '',
      thumbnailUrl:
        (ep.thumbnail_url as string) &&
        !(ep.thumbnail_url as string).startsWith('data:')
          ? (ep.thumbnail_url as string)
          : '',
      pubDate: ep.published_at
        ? new Date(ep.published_at as string).toUTCString()
        : '',
    }),
  )

  return { podcast, episodes }
}

function formatDurationHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface FeedEntry {
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

export async function listFeeds(): Promise<FeedEntry[]> {
  const result = await getPool().query(
    `SELECT f.id, f.podcast_id, f.episode_id,
            p.title AS podcast_title,
            p.cover_image_url AS podcast_cover_url,
            e.title AS episode_title,
            e.masked_video_token AS episode_token,
            e.thumbnail_url AS episode_thumbnail,
            u.email AS producer_email,
            f.created_at
     FROM public.feeds f
     JOIN public.podcasts p ON p.id = f.podcast_id AND p.deleted_at IS NULL
     JOIN public.episodes e ON e.id = f.episode_id AND e.deleted_at IS NULL
     JOIN public.users u ON u.id = p.user_id
     WHERE f.deleted_at IS NULL
       AND e.status = 'published'
     ORDER BY f.created_at DESC`,
  )

  return result.rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    podcast_id: row.podcast_id as string,
    episode_id: row.episode_id as string,
    podcast_title: row.podcast_title as string,
    podcast_cover_url: (row.podcast_cover_url as string) || '',
    episode_title: row.episode_title as string,
    episode_token: row.episode_token as string,
    episode_thumbnail: (row.episode_thumbnail as string) || '',
    producer_email: row.producer_email as string,
    created_at: row.created_at as string,
  }))
}

export async function insertFeed(
  podcastId: string,
  episodeId: string,
): Promise<{ id: string }> {
  const result = await getPool().query(
    `INSERT INTO public.feeds (podcast_id, episode_id)
     VALUES ($1, $2)
     RETURNING id`,
    [podcastId, episodeId],
  )

  return { id: result.rows[0].id }
}

export function buildRssFeed(
  podcast: PodcastFeedData,
  episodes: EpisodeFeedData[],
): string {
  const baseUrl =
    process.env.PLATFORM_BASE_URL || 'https://rotation-other-cant-gates.trycloudflare.com/'
  const buildDate = new Date().toUTCString()

  const episodeItems = episodes
    .map((ep) => {
      const pubDate = ep.pubDate
        ? `\n      <pubDate>${ep.pubDate}</pubDate>`
        : ''
      const duration = ep.duration
        ? `\n      <itunes:duration>${ep.duration}</itunes:duration>`
        : ''
      const thumbnail = ep.thumbnailUrl
        ? `\n      <itunes:image href="${xmlEsc(ep.thumbnailUrl)}"/>`
        : ''

      return `    <item>
      <title>${xmlEsc(ep.title)}</title>
      <link>${baseUrl}/player/${xmlEsc(ep.token)}</link>
      <description>${xmlEsc(ep.description)}</description>${pubDate}
      <guid isPermaLink="false">${xmlEsc(ep.token)}</guid>
      <enclosure url="${baseUrl}/player/${xmlEsc(ep.token)}" length="0" type="video/mp4"/>${duration}${thumbnail}
      <itunes:episodeType>full</itunes:episodeType>
    </item>`
    })
    .join('\n')

  const coverImage = podcast.coverImageUrl
    ? `\n    <itunes:image href="${xmlEsc(podcast.coverImageUrl)}"/>`
    : ''

  const category = podcast.categoryName
    ? `\n    <itunes:category text="${xmlEsc(podcast.categoryName)}"/>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xmlEsc(podcast.title)}</title>
    <link>${baseUrl}</link>
    <description>${xmlEsc(podcast.description)}</description>
    <language>pt-br</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <itunes:author>${xmlEsc(podcast.producerEmail)}</itunes:author>${coverImage}${category}
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${episodeItems}
  </channel>
</rss>`
}
