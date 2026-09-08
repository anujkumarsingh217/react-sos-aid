ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;