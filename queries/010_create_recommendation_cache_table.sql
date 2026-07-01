-- Recommendation cache table
-- Stores pre-computed podcast recommendations per viewer with a 6-hour TTL.
-- viewer_key holds the user UUID as text, allowing future extension to anonymous
-- viewers identified by ip_hash without a schema change.
-- Rows are replaced atomically (DELETE + INSERT in a transaction) each time
-- the recommendation pipeline runs for a given viewer.
-- The reason column holds a JSONB document explaining the scoring breakdown:
--   { "top_category": "...", "category_affinity": 0.75,
--     "avg_completion_in_category": 82.5, "popularity_score": 0.43 }

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

-- Primary access pattern: fetch active recommendations for a viewer, ranked by score.
CREATE INDEX IF NOT EXISTS idx_rec_cache_viewer_active
    ON public.recommendation_cache (viewer_key, score DESC)
    WHERE expires_at > NOW();

-- Supports cleanup of expired rows (future maintenance job).
CREATE INDEX IF NOT EXISTS idx_rec_cache_expires_at
    ON public.recommendation_cache (expires_at);
