import { pgPool } from "./setup";

export async function seedTestData(): Promise<{
  viewerUserId: string;
  producerUserId: string;
  podcastId: string;
  episodeIds: string[];
  episodeTokens: string[];
}> {
  const viewerId = (
    await pgPool.query(
      `INSERT INTO public.users (email, password, access_type)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["viewer@test.com", "hash", "viewer"],
    )
  ).rows[0].id;

  const producerId = (
    await pgPool.query(
      `INSERT INTO public.users (email, password, access_type)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["producer@test.com", "hash", "producer"],
    )
  ).rows[0].id;

  const categoryId = (
    await pgPool.query(
      `INSERT INTO public.podcast_categories (name, description)
       VALUES ($1, $2)
       RETURNING id`,
      ["Tech", "Tech category"],
    )
  ).rows[0].id;

  const podcastId = (
    await pgPool.query(
      `INSERT INTO public.podcasts (title, description, user_id, podcast_category_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ["Test Podcast", "A test podcast", producerId, categoryId],
    )
  ).rows[0].id;

  const episodeIds: string[] = [];
  const episodeTokens: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const token = `token-${crypto.randomUUID()}`;
    const ep = await pgPool.query(
      `INSERT INTO public.episodes (podcast_id, title, description, masked_video_token, status, duration_seconds, published_at)
       VALUES ($1, $2, $3, $4, 'published', $5, NOW())
       RETURNING id`,
      [podcastId, `Episode ${i}`, `Description ${i}`, token, 600 + i * 120],
    );
    episodeIds.push(ep.rows[0].id);
    episodeTokens.push(token);
  }

  return {
    viewerUserId: viewerId,
    producerUserId: producerId,
    podcastId,
    episodeIds,
    episodeTokens,
  };
}

export { pgPool };