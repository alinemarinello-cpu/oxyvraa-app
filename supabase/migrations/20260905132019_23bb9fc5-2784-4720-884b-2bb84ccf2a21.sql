DROP INDEX IF EXISTS public.notification_logs_dedupe;
CREATE UNIQUE INDEX notification_logs_dedupe ON public.notification_logs (organizacao_id, dedupe_key);