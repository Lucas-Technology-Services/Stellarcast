-- Likes table
-- A spector (or producer) can like a podcast or an episode.
-- target_type + target_id implement a lightweight polymorphic association.
-- The unique constraint prevents double-liking the same resource.

CREATE TABLE IF NOT EXISTS public.likes (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    target_type TEXT        NOT NULL CHECK (target_type IN ('podcast', 'episode')),
    target_id   UUID        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_likes       PRIMARY KEY (id),
    CONSTRAINT fk_likes_users FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,

    -- One like per user per target
    CONSTRAINT uq_likes_user_target UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes (user_id);
CREATE INDEX IF NOT EXISTS idx_likes_target   ON public.likes (target_type, target_id);
