-- Feeds table
-- Each feed entry links a published podcast episode for display on the Home page.
-- Inserted automatically when a producer creates a podcast with episodes.

CREATE TABLE IF NOT EXISTS public.feeds (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    podcast_id  UUID        NOT NULL,
    episode_id  UUID        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT pk_feeds              PRIMARY KEY (id),
    CONSTRAINT fk_feeds_podcasts     FOREIGN KEY (podcast_id)
        REFERENCES public.podcasts (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_feeds_episodes     FOREIGN KEY (episode_id)
        REFERENCES public.episodes (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feeds_podcast_id
    ON public.feeds (podcast_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feeds_episode_id
    ON public.feeds (episode_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feeds_deleted_at ON public.feeds (deleted_at);
