-- Auth tokens table
-- Stores machine-to-machine JWT tokens issued via POST /auth/token.
-- Every protected API call is validated against this table, which allows
-- explicit token revocation by deleting or expiring rows.

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
