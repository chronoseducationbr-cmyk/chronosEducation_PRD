ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nationality text DEFAULT '',
  ADD COLUMN IF NOT EXISTS civil_status text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rg_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS guardian_address text DEFAULT '';