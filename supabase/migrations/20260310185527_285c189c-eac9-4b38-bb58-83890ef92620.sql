ALTER TABLE public.enrollments
  ALTER COLUMN inscription_fee_cents SET DEFAULT 0,
  ALTER COLUMN tuition_installment_cents SET DEFAULT 0,
  ALTER COLUMN tuition_installments SET DEFAULT 16,
  ALTER COLUMN summercamp_installment_cents SET DEFAULT 0,
  ALTER COLUMN summercamp_installments SET DEFAULT 6;