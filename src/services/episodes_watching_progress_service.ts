import { Pool } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }
  return _pool;
}

export interface WatchProgress {
  id: string;
  episode_id: string;
  user_id: string | null;
  ip_hash: string;
  progress_pct: number;
  recorded_at: string;
}

export interface WatchProgressWithEpisode extends WatchProgress {
  episode_title: string;
  podcast_title: string;
  podcast_id: string;
}

export interface ViewerCompletionRate {
  user_id: string;
  email: string;
  total_episodes_watched: number;
  completed_episodes: number;
  completion_rate: number;
}

export interface ViewerFrequentCompletion {
  user_id: string;
  email: string;
  completed_episode_count: number;
  last_completed_at: string;
}

export interface RecentlyCompletedEpisode {
  episode_id: string;
  episode_title: string;
  episode_token: string;
  podcast_id: string;
  podcast_title: string;
  completed_at: string;
  completions_count: number;
}

export interface ProducerMetrics {
  podcast_id: string;
  podcast_title: string;
  total_episodes: number;
  total_completions: number;
  unique_viewers: number;
  avg_completion_rate: number;
  last_7d_completions: number;
  last_30d_completions: number;
}

export interface ProducerEpisodeMetrics {
  episode_id: string;
  episode_title: string;
  episode_token: string;
  published_at: string | null;
  duration_seconds: number | null;
  total_watch_attempts: number;
  completions: number;
  completion_rate: number;
  unique_viewers_completed: number;
}

export interface EpisodeCompletionFrequency {
  episode_id: string;
  episode_title: string;
  episode_token: string;
  podcast_title: string;
  total_viewers_completed: number;
  unique_viewers_completed: number;
}

const watchProgressCols = `id, episode_id, user_id, ip_hash, progress_pct, recorded_at`;

export async function upsertWatchProgress(data: {
  episode_token: string;
  user_id?: string;
  ip_hash: string;
  progress_pct: number;
}): Promise<WatchProgress> {
  const pool = getPool();

  const episodeResult = await pool.query(
    `SELECT id FROM public.episodes
     WHERE masked_video_token = $1 AND deleted_at IS NULL`,
    [data.episode_token],
  );
  if (episodeResult.rows.length === 0) {
    throw new Error("episode not found");
  }
  const episodeID = episodeResult.rows[0].id;

  if (data.user_id) {
    const result = await pool.query(
      `INSERT INTO public.watch_progress (episode_id, user_id, ip_hash, progress_pct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, episode_id)
         WHERE user_id IS NOT NULL
       DO UPDATE SET progress_pct = EXCLUDED.progress_pct,
                     ip_hash = EXCLUDED.ip_hash,
                     recorded_at = CURRENT_TIMESTAMP
       RETURNING ${watchProgressCols}`,
      [episodeID, data.user_id, data.ip_hash, data.progress_pct],
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO public.watch_progress (episode_id, ip_hash, progress_pct)
     VALUES ($1, $2, $3)
     RETURNING ${watchProgressCols}`,
    [episodeID, data.ip_hash, data.progress_pct],
  );
  return result.rows[0];
}

export async function resolveEpisodeTokenByID(
  episodeID: string,
): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT masked_video_token FROM public.episodes
     WHERE id = $1 AND deleted_at IS NULL`,
    [episodeID],
  );
  if (result.rows.length === 0) {
    throw new Error("episode not found");
  }
  return result.rows[0].masked_video_token;
}

export async function listProgressByEpisodeToken(
  episode_token: string,
): Promise<WatchProgress[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${watchProgressCols}
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id
     WHERE e.masked_video_token = $1 AND e.deleted_at IS NULL
     ORDER BY wp.recorded_at DESC`,
    [episode_token],
  );
  return result.rows;
}

export async function listProgressByIPHash(
  ip_hash: string,
  limit: number = 50,
): Promise<WatchProgressWithEpisode[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${watchProgressCols},
            e.title AS episode_title,
            p.title AS podcast_title,
            p.id AS podcast_id
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id AND e.deleted_at IS NULL
     JOIN public.podcasts p ON p.id = e.podcast_id AND p.deleted_at IS NULL
     WHERE wp.ip_hash = $1
     ORDER BY wp.recorded_at DESC
     LIMIT $2`,
    [ip_hash, limit],
  );
  return result.rows;
}

export async function getLatestProgressByEpisode(
  episode_token: string,
  ip_hash: string,
): Promise<WatchProgress | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${watchProgressCols}
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id
     WHERE e.masked_video_token = $1
       AND wp.ip_hash = $2
       AND e.deleted_at IS NULL
     ORDER BY wp.recorded_at DESC
     LIMIT 1`,
    [episode_token, ip_hash],
  );
  return result.rows[0] || null;
}

export async function getLatestProgressByUser(
  user_id: string,
  limit: number = 20,
): Promise<WatchProgressWithEpisode[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${watchProgressCols},
            e.title AS episode_title,
            p.title AS podcast_title,
            p.id AS podcast_id
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id AND e.deleted_at IS NULL
     JOIN public.podcasts p ON p.id = e.podcast_id AND p.deleted_at IS NULL
     WHERE wp.user_id = $1
     ORDER BY wp.recorded_at DESC
     LIMIT $2`,
    [user_id, limit],
  );
  return result.rows;
}

export async function getViewerCompletionRates(
  min_episodes: number = 3,
): Promise<ViewerCompletionRate[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       wp.user_id,
       u.email,
       COUNT(*)::int AS total_episodes_watched,
       COUNT(*) FILTER (WHERE wp.progress_pct >= 90)::int AS completed_episodes,
       ROUND(
         COUNT(*) FILTER (WHERE wp.progress_pct >= 90)::numeric /
         NULLIF(COUNT(*), 0) * 100, 2
       )::float AS completion_rate
     FROM public.watch_progress wp
     JOIN public.users u ON u.id = wp.user_id AND u.deleted_at IS NULL
     WHERE wp.user_id IS NOT NULL
       AND u.access_type = 'viewer'
     GROUP BY wp.user_id, u.email
     HAVING COUNT(*) >= $1
     ORDER BY completion_rate DESC`,
    [min_episodes],
  );
  return result.rows;
}

export async function getViewerFrequentCompletions(
  min_completions: number = 5,
): Promise<ViewerFrequentCompletion[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       wp.user_id,
       u.email,
       COUNT(*)::int AS completed_episode_count,
       MAX(wp.recorded_at)::text AS last_completed_at
     FROM public.watch_progress wp
     JOIN public.users u ON u.id = wp.user_id AND u.deleted_at IS NULL
     WHERE wp.user_id IS NOT NULL
       AND u.access_type = 'viewer'
       AND wp.progress_pct >= 90
     GROUP BY wp.user_id, u.email
     HAVING COUNT(*) >= $1
     ORDER BY completed_episode_count DESC, last_completed_at DESC`,
    [min_completions],
  );
  return result.rows;
}

export async function getRecentlyCompletedEpisodes(
  limit_days: number = 30,
): Promise<RecentlyCompletedEpisode[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       e.id AS episode_id,
       e.title AS episode_title,
       e.masked_video_token AS episode_token,
       p.id AS podcast_id,
       p.title AS podcast_title,
       MAX(wp.recorded_at)::text AS completed_at,
       COUNT(*)::int AS completions_count
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id AND e.deleted_at IS NULL
     JOIN public.podcasts p ON p.id = e.podcast_id AND p.deleted_at IS NULL
     JOIN public.users u ON u.id = wp.user_id AND u.deleted_at IS NULL
     WHERE wp.progress_pct >= 90
       AND wp.user_id IS NOT NULL
       AND u.access_type = 'viewer'
       AND wp.recorded_at >= CURRENT_TIMESTAMP - ($1 || ' days')::interval
     GROUP BY e.id, e.title, e.masked_video_token, p.id, p.title
     ORDER BY MAX(wp.recorded_at) DESC`,
    [String(limit_days)],
  );
  return result.rows;
}

export async function getEpisodeCompletionFrequency(
  min_viewers: number = 1,
): Promise<EpisodeCompletionFrequency[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       e.id AS episode_id,
       e.title AS episode_title,
       e.masked_video_token AS episode_token,
       p.title AS podcast_title,
       COUNT(*)::int AS total_viewers_completed,
       COUNT(DISTINCT wp.user_id)::int AS unique_viewers_completed
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id AND e.deleted_at IS NULL
     JOIN public.podcasts p ON p.id = e.podcast_id AND p.deleted_at IS NULL
     JOIN public.users u ON u.id = wp.user_id AND u.deleted_at IS NULL
     WHERE wp.progress_pct >= 90
       AND wp.user_id IS NOT NULL
       AND u.access_type = 'viewer'
     GROUP BY e.id, e.title, e.masked_video_token, p.title
     HAVING COUNT(DISTINCT wp.user_id) >= $1
     ORDER BY unique_viewers_completed DESC, total_viewers_completed DESC`,
    [min_viewers],
  );
  return result.rows;
}

export async function getProducerMetricsByEmail(
  email: string,
): Promise<ProducerMetrics[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       p.id AS podcast_id,
       p.title AS podcast_title,
       COUNT(DISTINCT e.id)::int AS total_episodes,
       COUNT(wp.id) FILTER (WHERE wp.progress_pct >= 90)::int AS total_completions,
       COUNT(DISTINCT wp.user_id)::int AS unique_viewers,
       ROUND(
         (COUNT(wp.id) FILTER (WHERE wp.progress_pct >= 90)::numeric /
          NULLIF(COUNT(wp.id), 0)) * 100, 2
       )::float AS avg_completion_rate,
       COUNT(wp.id) FILTER (
         WHERE wp.progress_pct >= 90
           AND wp.recorded_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
       )::int AS last_7d_completions,
       COUNT(wp.id) FILTER (
         WHERE wp.progress_pct >= 90
           AND wp.recorded_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
       )::int AS last_30d_completions
     FROM public.users u
     JOIN public.podcasts p ON p.user_id = u.id AND p.deleted_at IS NULL
     LEFT JOIN public.episodes e ON e.podcast_id = p.id AND e.deleted_at IS NULL
     LEFT JOIN public.watch_progress wp ON wp.episode_id = e.id
     WHERE LOWER(u.email) = LOWER($1)
       AND u.deleted_at IS NULL
       AND u.access_type = 'producer'
     GROUP BY p.id, p.title
     ORDER BY last_30d_completions DESC, total_completions DESC`,
    [email.trim()],
  );
  if (result.rows.length === 0) {
    throw new Error("producer not found or no podcasts");
  }
  return result.rows;
}

export async function getProducerEpisodeMetricsByEmail(
  email: string,
): Promise<ProducerEpisodeMetrics[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT
       e.id AS episode_id,
       e.title AS episode_title,
       e.masked_video_token AS episode_token,
       e.published_at::text AS published_at,
       e.duration_seconds,
       COUNT(wp.id)::int AS total_watch_attempts,
       COUNT(wp.id) FILTER (WHERE wp.progress_pct >= 90)::int AS completions,
       ROUND(
         (COUNT(wp.id) FILTER (WHERE wp.progress_pct >= 90)::numeric /
          NULLIF(COUNT(wp.id), 0)) * 100, 2
       )::float AS completion_rate,
       COUNT(DISTINCT wp.user_id) FILTER (WHERE wp.progress_pct >= 90)::int AS unique_viewers_completed
     FROM public.users u
     JOIN public.podcasts p ON p.user_id = u.id AND p.deleted_at IS NULL
     JOIN public.episodes e ON e.podcast_id = p.id AND e.deleted_at IS NULL
     LEFT JOIN public.watch_progress wp ON wp.episode_id = e.id
     WHERE LOWER(u.email) = LOWER($1)
       AND u.deleted_at IS NULL
       AND u.access_type = 'producer'
     GROUP BY e.id, e.title, e.masked_video_token, e.published_at, e.duration_seconds
     ORDER BY e.published_at DESC NULLS LAST, e.created_at DESC`,
    [email.trim()],
  );
  if (result.rows.length === 0) {
    throw new Error("producer not found or no episodes");
  }
  return result.rows;
}

export async function getCompletedEpisodesByUser(
  user_id: string,
): Promise<WatchProgressWithEpisode[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${watchProgressCols},
            e.title AS episode_title,
            p.title AS podcast_title,
            p.id AS podcast_id
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id AND e.deleted_at IS NULL
     JOIN public.podcasts p ON p.id = e.podcast_id AND p.deleted_at IS NULL
     WHERE wp.user_id = $1
       AND wp.progress_pct >= 90
     ORDER BY wp.recorded_at DESC`,
    [user_id],
  );
  return result.rows;
}

export async function getCompletedEpisodesByIPHash(
  ip_hash: string,
): Promise<WatchProgressWithEpisode[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${watchProgressCols},
            e.title AS episode_title,
            p.title AS podcast_title,
            p.id AS podcast_id
     FROM public.watch_progress wp
     JOIN public.episodes e ON e.id = wp.episode_id AND e.deleted_at IS NULL
     JOIN public.podcasts p ON p.id = e.podcast_id AND p.deleted_at IS NULL
     WHERE wp.ip_hash = $1
       AND wp.progress_pct >= 90
     ORDER BY wp.recorded_at DESC`,
    [ip_hash],
  );
  return result.rows;
}

export async function countCompletedEpisodesByUser(
  user_id: string,
): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM public.watch_progress
     WHERE user_id = $1 AND progress_pct >= 90`,
    [user_id],
  );
  return result.rows[0].count;
}

export async function countCompletedEpisodesByIPHash(
  ip_hash: string,
): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM public.watch_progress
     WHERE ip_hash = $1 AND progress_pct >= 90`,
    [ip_hash],
  );
  return result.rows[0].count;
}