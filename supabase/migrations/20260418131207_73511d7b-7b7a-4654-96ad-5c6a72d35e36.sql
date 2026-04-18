ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS contract_guardian_full_name text,
  ADD COLUMN IF NOT EXISTS contract_guardian_email text,
  ADD COLUMN IF NOT EXISTS contract_guardian_phone text,
  ADD COLUMN IF NOT EXISTS contract_guardian_cpf text,
  ADD COLUMN IF NOT EXISTS contract_guardian_rg text,
  ADD COLUMN IF NOT EXISTS contract_guardian_nationality text,
  ADD COLUMN IF NOT EXISTS contract_guardian_civil_status text,
  ADD COLUMN IF NOT EXISTS contract_guardian_profession text,
  ADD COLUMN IF NOT EXISTS contract_guardian_address text;