-- Comments table
-- Spectors and producers can comment on episodes.
-- parent_id enables threaded (nested) replies to existing comments.

CREATE TABLE IF NOT EXISTS public.comments (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    podcast_id  UUID        NOT NULL,
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
    CONSTRAINT fk_comments_podcasts FOREIGN KEY (podcast_id)
        REFERENCES public.podcasts (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent   FOREIGN KEY (parent_id)
        REFERENCES public.comments (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_podcast_id
    ON public.comments (podcast_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_user_id
    ON public.comments (user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
    ON public.comments (parent_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON public.comments (deleted_at);
