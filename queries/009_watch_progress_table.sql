-- Watch progress table
-- Tracks how far into each episode a viewer has watched (0–100%).
-- Only the highest progress value is kept per (user, episode) pair — progress never regresses.
-- user_id is nullable to allow future anonymous tracking; for now the recommendation
-- pipeline only uses authenticated viewers (user_id IS NOT NULL).
-- ip_hash is stored for consistency with play_events and LGPD compliance.

CREATE TABLE IF NOT EXISTS public.watch_progress (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    episode_id   UUID        NOT NULL,
    user_id      UUID,
    ip_hash      CHAR(64)    NOT NULL,
    progress_pct SMALLINT    NOT NULL DEFAULT 0
                             CONSTRAINT wp_pct_range
                             CHECK (progress_pct >= 0 AND progress_pct <= 100),
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_watch_progress    PRIMARY KEY (id),
    CONSTRAINT fk_wp_episode        FOREIGN KEY (episode_id)
        REFERENCES public.episodes (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_wp_user           FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE SET NULL
);

-- Partial unique index: one row per (user, episode) when the viewer is identified.
-- Anonymous rows (user_id IS NULL) are not deduplicated at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_progress_user_episode
    ON public.watch_progress (user_id, episode_id)
    WHERE user_id IS NOT NULL;

-- Supports the background refresh query that finds active viewers.
CREATE INDEX IF NOT EXISTS idx_watch_progress_user_recorded
    ON public.watch_progress (user_id, recorded_at DESC)
    WHERE user_id IS NOT NULL;

-- Supports joins from the recommendation scoring queries.
CREATE INDEX IF NOT EXISTS idx_watch_progress_episode
    ON public.watch_progress (episode_id);
