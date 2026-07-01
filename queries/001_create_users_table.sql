-- Users table
-- Stores producer and spector accounts.
-- access_type drives all authorization decisions in the application layer.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Unique email per active (non-deleted) user
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
    ON public.users (email)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users (deleted_at);
