-- ============================================================
-- Podcast API — full schema bootstrap
-- Run this script once against a fresh database.
-- Order matters: parent tables must exist before child tables.
--
-- Access-type rules enforced by this schema:
--   producer → can INSERT into public.podcasts and public.episodes
--   spector  → can INSERT into public.likes, public.comments, public.shares
--   Both types share the same public.users table; the access_type column
--   drives all authorization. A trigger on public.podcasts guarantees
--   that producer_id always references a user with access_type='producer'.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    email       TEXT        NOT NULL,
    password    TEXT        NOT NULL,
    access_type TEXT        NOT NULL DEFAULT 'spector'
                            CHECK (access_type IN ('producer', 'spector')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT pk_users PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
    ON public.users (email)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users (deleted_at);

-- ── 2. Podcasts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.podcasts (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    producer_id     UUID        NOT NULL,
    title           TEXT        NOT NULL,
    description     TEXT,
    cover_image_url TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT pk_podcasts       PRIMARY KEY (id),
    CONSTRAINT fk_podcasts_users FOREIGN KEY (producer_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_podcasts_producer_id
    ON public.podcasts (producer_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_podcasts_deleted_at ON public.podcasts (deleted_at);

-- ── 3. Episodes ───────────────────────────────────────────────
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_masked_video_token
    ON public.episodes (masked_video_token)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_episodes_deleted_at ON public.episodes (deleted_at);

-- ── 4. Likes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    target_type TEXT        NOT NULL CHECK (target_type IN ('podcast', 'episode')),
    target_id   UUID        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_likes             PRIMARY KEY (id),
    CONSTRAINT fk_likes_users       FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT uq_likes_user_target UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes (user_id);
CREATE INDEX IF NOT EXISTS idx_likes_target   ON public.likes (target_type, target_id);

-- ── 5. Comments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    episode_id  UUID        NOT NULL,
    parent_id   UUID,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT pk_comments          PRIMARY KEY (id),
    CONSTRAINT fk_comments_users    FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_episodes FOREIGN KEY (episode_id)
        REFERENCES public.episodes (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent   FOREIGN KEY (parent_id)
        REFERENCES public.comments (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_episode_id
    ON public.comments (episode_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_user_id
    ON public.comments (user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
    ON public.comments (parent_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON public.comments (deleted_at);

-- ── 6. Shares ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shares (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID,
    target_type TEXT        NOT NULL CHECK (target_type IN ('podcast', 'episode')),
    target_id   UUID        NOT NULL,
    share_token TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
    platform    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_shares       PRIMARY KEY (id),
    CONSTRAINT uq_shares_token UNIQUE (share_token),
    CONSTRAINT fk_shares_users FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares (user_id);
CREATE INDEX IF NOT EXISTS idx_shares_target  ON public.shares (target_type, target_id);

-- ── 7. Trigger: only producers may own a podcast ──────────────
-- DB-level guard that mirrors the producerOnly middleware.
-- Fires on INSERT and UPDATE OF producer_id.

CREATE OR REPLACE FUNCTION fn_check_podcast_producer()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   public.users
        WHERE  id          = NEW.producer_id
          AND  access_type = 'producer'
          AND  deleted_at  IS NULL
    ) THEN
        RAISE EXCEPTION
            'podcasts.producer_id must reference an active user with access_type = ''producer'' (got: %)',
            NEW.producer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_podcasts_producer_check
    BEFORE INSERT OR UPDATE OF producer_id
    ON public.podcasts
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_podcast_producer();

-- ── 9. Watch progress ─────────────────────────────────────────
-- Tracks per-viewer episode progress for the recommendation pipeline.
CREATE TABLE IF NOT EXISTS public.watch_progress (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    episode_id   UUID        NOT NULL,
    user_id      UUID,
    ip_hash      CHAR(64)    NOT NULL,
    progress_pct SMALLINT    NOT NULL DEFAULT 0
                             CONSTRAINT wp_pct_range
                             CHECK (progress_pct >= 0 AND progress_pct <= 100),
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_watch_progress PRIMARY KEY (id),
    CONSTRAINT fk_wp_episode     FOREIGN KEY (episode_id)
        REFERENCES public.episodes (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_wp_user        FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_progress_user_episode
    ON public.watch_progress (user_id, episode_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_watch_progress_user_recorded
    ON public.watch_progress (user_id, recorded_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_watch_progress_episode
    ON public.watch_progress (episode_id);

-- ── 10. Recommendation cache ───────────────────────────────────
-- Pre-computed podcast recommendations per viewer, refreshed every 6 hours.
CREATE TABLE IF NOT EXISTS public.recommendation_cache (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    viewer_key   TEXT         NOT NULL,
    podcast_id   UUID         NOT NULL,
    score        NUMERIC(6,4) NOT NULL,
    reason       JSONB        NOT NULL DEFAULT '{}',
    generated_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at   TIMESTAMPTZ  NOT NULL,

    CONSTRAINT pk_recommendation_cache PRIMARY KEY (id),
    CONSTRAINT fk_rc_podcast           FOREIGN KEY (podcast_id)
        REFERENCES public.podcasts (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rec_cache_viewer_active
    ON public.recommendation_cache (viewer_key, score DESC)
    WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_rec_cache_expires_at
    ON public.recommendation_cache (expires_at);

-- ── 8. Auth tokens ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_tokens (
    id         UUID                     NOT NULL DEFAULT gen_random_uuid(),
    client_id  CHARACTER VARYING(255),
    jwt_token  CHARACTER VARYING(2048),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT pk_auth_tokens PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_client_id
    ON public.auth_tokens (client_id);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at
    ON public.auth_tokens (expires_at);
