-- Episodes table
-- Each episode holds the metadata and the masked YouTube token.
-- youtube_video_id is never returned to the client; masked_video_token
-- is the opaque identifier exposed in the player URL (e.g. /player/:token).

CREATE TABLE IF NOT EXISTS public.episodes (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    podcast_id          UUID        NOT NULL,
    title               TEXT        NOT NULL,
    description         TEXT,
    youtube_video_id    TEXT,
    masked_video_token  TEXT        UNIQUE,
    status              TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'processing', 'published', 'failed')),
    duration_seconds    INTEGER,
    thumbnail_url       TEXT,
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT pk_episodes          PRIMARY KEY (id),
    CONSTRAINT fk_episodes_podcasts FOREIGN KEY (podcast_id)
        REFERENCES public.podcasts (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id
    ON public.episodes (podcast_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_episodes_status
    ON public.episodes (status)
    WHERE deleted_at IS NULL;

-- Used by the player URL resolver to look up the real YouTube ID server-side
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_masked_video_token
    ON public.episodes (masked_video_token)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_episodes_deleted_at ON public.episodes (deleted_at);
