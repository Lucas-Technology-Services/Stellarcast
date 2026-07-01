-- Trigger: enforce that only users with access_type = 'producer' can own a podcast.
-- This is a DB-level safety net on top of the application-layer producerOnly middleware.
-- Fires on INSERT and UPDATE so that a later access_type change cannot orphan data.

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
