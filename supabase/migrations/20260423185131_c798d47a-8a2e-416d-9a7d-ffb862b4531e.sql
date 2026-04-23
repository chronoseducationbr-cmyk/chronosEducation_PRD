ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS contract_text_wayland text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS contract_text_summercamp_wayland text NOT NULL DEFAULT '';