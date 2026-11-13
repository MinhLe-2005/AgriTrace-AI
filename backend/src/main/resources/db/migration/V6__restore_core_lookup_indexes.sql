-- Existing installations may have created V1 tables through Hibernate instead of Flyway.
-- Restore the two lookup indexes already specified in V1 without rebuilding core tables.
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
