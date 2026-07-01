-- Podcasts table
-- A podcast is a channel owned by a producer. Episodes belong to it.

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
