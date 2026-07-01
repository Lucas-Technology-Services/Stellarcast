-- Migration: Replace producer_id with user_id on public.podcasts
-- Drops the trigger, trigger function, index, FK constraint, and column producer_id.
-- Adds user_id (UUID NOT NULL) with FK referencing public.users(id).
-- Existing rows have producer_id copied to user_id before the old column is removed.

BEGIN;

-- 1. Drop trigger and function that depended on producer_id
DROP TRIGGER IF EXISTS trg_podcasts_producer_check ON public.podcasts;
DROP FUNCTION IF EXISTS fn_check_podcast_producer();

-- 2. Add user_id as nullable to safely handle existing rows
ALTER TABLE public.podcasts
    ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Populate user_id from producer_id for any existing rows
UPDATE public.podcasts
   SET user_id = producer_id
 WHERE user_id IS NULL;

-- 4. Enforce NOT NULL now that every row has a value
ALTER TABLE public.podcasts
    ALTER COLUMN user_id SET NOT NULL;

-- 5. Add FK constraint referencing public.users(id)
ALTER TABLE public.podcasts
    ADD CONSTRAINT fk_podcasts_user_id FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE;

-- 6. Add index matching the pattern of the old idx_podcasts_producer_id
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id
    ON public.podcasts (user_id)
    WHERE deleted_at IS NULL;

-- 7. Drop the old index, FK constraint, and column
DROP INDEX IF EXISTS public.idx_podcasts_producer_id;

ALTER TABLE public.podcasts
    DROP CONSTRAINT IF EXISTS fk_podcasts_users,
    DROP COLUMN IF EXISTS producer_id;

COMMIT;
