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

export interface PodcastCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Podcast {
  id: string;
  user_id: string;
  podcast_category_id: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  category?: PodcastCategory | null;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description: string | null;
  masked_video_token: string;
  status: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  play_count: number;
}

export async function fetchCategories(): Promise<PodcastCategory[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, description, created_at, updated_at
     FROM public.podcast_categories
     WHERE deleted_at IS NULL
     ORDER BY name ASC`,
  );
  return result.rows;
}

export async function getCategoryByName(
  name: string,
): Promise<PodcastCategory> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, name, description, created_at, updated_at
     FROM public.podcast_categories
     WHERE LOWER(name) = LOWER($1) AND deleted_at IS NULL`,
    [name.trim()],
  );
  if (result.rows.length === 0) {
    throw new Error("category not found");
  }
  return result.rows[0];
}

export async function createCategory(
  name: string,
  description: string | null,
): Promise<PodcastCategory> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO public.podcast_categories (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description, created_at, updated_at`,
    [name, description],
  );
  return result.rows[0];
}

export async function updateCategory(
  id: string,
  name: string,
  description: string | null,
): Promise<PodcastCategory> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE public.podcast_categories
     SET name = $2, description = $3, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, name, description, created_at, updated_at`,
    [id, name, description],
  );
  if (result.rows.length === 0) {
    throw new Error("category not found");
  }
  return result.rows[0];
}

export async function deleteCategory(id: string): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE public.podcast_categories
     SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (result.rowCount === 0) {
    throw new Error("category not found");
  }
}

export async function resolveCategoryIDByName(
  name: string,
): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id FROM public.podcast_categories
     WHERE LOWER(name) = LOWER($1) AND deleted_at IS NULL`,
    [name.trim()],
  );
  if (result.rows.length === 0) {
    throw new Error("category not found");
  }
  return result.rows[0].id;
}

const podcastCols = `id, user_id, podcast_category_id, title, description, cover_image_url, created_at, updated_at`;

export async function resolveUserIDByEmail(email: string): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id FROM public.users
     WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
    [email.trim()],
  );
  if (result.rows.length === 0) {
    throw new Error("user not found");
  }
  return result.rows[0].id;
}

export async function resolvePodcastIDByTitle(
  title: string,
): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id FROM public.podcasts
     WHERE LOWER(title) = LOWER($1) AND deleted_at IS NULL`,
    [title.trim()],
  );
  if (result.rows.length === 0) {
    throw new Error("podcast not found");
  }
  return result.rows[0].id;
}

export async function createPodcast(data: {
  email: string;
  title: string;
  description?: string;
  category_name?: string;
  cover_image_url?: string;
}): Promise<Podcast> {
  const pool = getPool();

  const userID = await resolveUserIDByEmail(data.email);

  let categoryID: string | null = null;
  if (data.category_name) {
    categoryID = await resolveCategoryIDByName(data.category_name);
  }

  const result = await pool.query(
    `INSERT INTO public.podcasts (user_id, podcast_category_id, title, description, cover_image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${podcastCols}`,
    [
      userID,
      categoryID,
      data.title,
      data.description ?? null,
      data.cover_image_url ?? null,
    ],
  );
  return result.rows[0];
}

export async function listAllPodcasts(): Promise<Podcast[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${podcastCols}
     FROM public.podcasts
     WHERE deleted_at IS NULL
     ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function listPodcastsByUserID(
  userID: string,
): Promise<Podcast[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${podcastCols}
     FROM public.podcasts
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [userID],
  );
  return result.rows;
}

export async function getPodcastByID(id: string): Promise<Podcast> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${podcastCols}
     FROM public.podcasts
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (result.rows.length === 0) {
    throw new Error("podcast not found");
  }
  return result.rows[0];
}

export async function getPodcastByTitle(title: string): Promise<Podcast> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.${podcastCols},
            jsonb_build_object(
              'id', pc.id,
              'name', pc.name,
              'description', pc.description,
              'created_at', pc.created_at,
              'updated_at', pc.updated_at
            ) AS category
     FROM public.podcasts p
     LEFT JOIN public.podcast_categories pc ON pc.id = p.podcast_category_id AND pc.deleted_at IS NULL
     WHERE LOWER(p.title) = LOWER($1) AND p.deleted_at IS NULL`,
    [title.trim()],
  );
  if (result.rows.length === 0) {
    throw new Error("podcast not found");
  }
  return result.rows[0];
}

export async function updatePodcast(
  id: string,
  data: {
    title: string;
    description?: string;
    category_name?: string;
    cover_image_url?: string;
  },
): Promise<Podcast> {
  const pool = getPool();

  let categoryID: string | null = null;
  if (data.category_name) {
    categoryID = await resolveCategoryIDByName(data.category_name);
  }

  const result = await pool.query(
    `UPDATE public.podcasts
     SET podcast_category_id = $2, title = $3, description = $4, cover_image_url = $5, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${podcastCols}`,
    [id, categoryID, data.title, data.description ?? null, data.cover_image_url ?? null],
  );
  if (result.rows.length === 0) {
    throw new Error("podcast not found");
  }
  return result.rows[0];
}

export async function updatePodcastCoverImage(
  id: string,
  base64Image: string,
): Promise<Podcast> {
  const pool = getPool();
  await pool.query(
    `UPDATE public.podcasts
     SET cover_image_url = $2, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id, base64Image],
  );
  return getPodcastByID(id);
}

export async function deletePodcast(id: string): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE public.podcasts
     SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (result.rowCount === 0) {
    throw new Error("podcast not found");
  }
}

const episodeCols = `id, podcast_id, title, description, masked_video_token, status, duration_seconds, thumbnail_url, published_at, created_at, updated_at`;

const episodeSelectCols = `${episodeCols},
  (SELECT COUNT(*) FROM public.play_events pe WHERE pe.episode_id = e.id) AS play_count`;

const episodeReturnCols = `${episodeCols},
  (SELECT COUNT(*) FROM public.play_events pe WHERE pe.episode_id = id) AS play_count`;

export async function listEpisodesByPodcastID(
  podcastID: string,
): Promise<Episode[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${episodeSelectCols}
     FROM public.episodes e
     WHERE e.podcast_id = $1 AND e.deleted_at IS NULL
     ORDER BY e.created_at DESC`,
    [podcastID],
  );
  return result.rows;
}

export async function listEpisodes(
  podcastTitle: string,
): Promise<Episode[]> {
  const podcastID = await resolvePodcastIDByTitle(podcastTitle);
  return listEpisodesByPodcastID(podcastID);
}

export async function createEpisode(
  podcastTitle: string,
  data: {
    title: string;
    description?: string;
    duration_seconds?: number;
  },
): Promise<Episode> {
  const pool = getPool();
  const podcastID = await resolvePodcastIDByTitle(podcastTitle);

  const maskedToken = crypto.randomUUID();

  const result = await pool.query(
    `INSERT INTO public.episodes
       (podcast_id, title, description, masked_video_token, duration_seconds)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${episodeReturnCols}`,
    [
      podcastID,
      data.title,
      data.description ?? null,
      maskedToken,
      data.duration_seconds ?? null,
    ],
  );
  return result.rows[0];
}

export async function getEpisodeByID(id: string): Promise<Episode> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${episodeSelectCols}
     FROM public.episodes e
     WHERE e.id = $1 AND e.deleted_at IS NULL`,
    [id],
  );
  if (result.rows.length === 0) {
    throw new Error("episode not found");
  }
  return result.rows[0];
}

export async function getEpisodeByToken(
  token: string,
): Promise<Episode> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${episodeSelectCols}
     FROM public.episodes e
     WHERE e.masked_video_token = $1 AND e.deleted_at IS NULL`,
    [token],
  );
  if (result.rows.length === 0) {
    throw new Error("episode not found");
  }
  return result.rows[0];
}

export async function updateEpisode(
  id: string,
  data: {
    title: string;
    description?: string;
    thumbnail_url?: string;
    duration_seconds?: number;
  },
): Promise<Episode> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE public.episodes
     SET title = $2, description = $3, thumbnail_url = $4, duration_seconds = $5, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${episodeReturnCols}`,
    [id, data.title, data.description ?? null, data.thumbnail_url ?? null, data.duration_seconds ?? null],
  );
  if (result.rows.length === 0) {
    throw new Error("episode not found");
  }
  return result.rows[0];
}

export async function updateEpisodeThumbnail(
  id: string,
  base64Image: string,
): Promise<Episode> {
  const pool = getPool();
  await pool.query(
    `UPDATE public.episodes
     SET thumbnail_url = $2, updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id, base64Image],
  );
  return getEpisodeByID(id);
}

export async function deleteEpisode(id: string): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE public.episodes
     SET deleted_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (result.rowCount === 0) {
    throw new Error("episode not found");
  }
}

export async function getPodcastOwnerByEpisodeID(
  episodeID: string,
): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT p.user_id FROM public.podcasts p
     JOIN public.episodes e ON e.podcast_id = p.id
     WHERE e.id = $1 AND e.deleted_at IS NULL AND p.deleted_at IS NULL`,
    [episodeID],
  );
  if (result.rows.length === 0) {
    throw new Error("episode or podcast not found");
  }
  return result.rows[0].user_id;
}

export async function setYoutubeVideoId(
  episodeId: string,
  youtubeVideoId: string,
): Promise<Episode> {
  const pool = getPool()
  const result = await pool.query(
    `UPDATE public.episodes
     SET youtube_video_id = $2, status = 'published', published_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING ${episodeReturnCols}`,
    [episodeId, youtubeVideoId],
  )
  if (result.rows.length === 0) {
    throw new Error('episode not found')
  }
  return result.rows[0]
}

export async function getEpisodeYoutubeVideoId(
  episodeId: string,
): Promise<string> {
  const pool = getPool()
  const result = await pool.query(
    `SELECT youtube_video_id FROM public.episodes
     WHERE id = $1 AND deleted_at IS NULL AND youtube_video_id IS NOT NULL`,
    [episodeId],
  )
  if (result.rows.length === 0) {
    throw new Error('episode not found or no video')
  }
  return result.rows[0].youtube_video_id
}

export async function resolveEpisodeIDByToken(
  token: string,
): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id FROM public.episodes
     WHERE masked_video_token = $1 AND deleted_at IS NULL`,
    [token],
  );
  if (result.rows.length === 0) {
    throw new Error("episode not found");
  }
  return result.rows[0].id;
}
