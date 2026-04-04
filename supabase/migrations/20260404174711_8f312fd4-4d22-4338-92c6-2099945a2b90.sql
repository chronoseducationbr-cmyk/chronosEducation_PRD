
ALTER TABLE public.enrollments 
  ADD COLUMN contract_sent_at_summercamp timestamptz DEFAULT NULL,
  ADD COLUMN contract_signed_at_summercamp timestamptz DEFAULT NULL;

-- Rename existing columns for clarity
ALTER TABLE public.enrollments RENAME COLUMN contract_sent_at TO contract_sent_at_platform;
ALTER TABLE public.enrollments RENAME COLUMN contract_signed_at TO contract_signed_at_platform;
