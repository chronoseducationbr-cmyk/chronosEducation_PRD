ALTER TABLE public.enrollments
  ADD COLUMN inscription_fee_cents integer NOT NULL DEFAULT 80000,
  ADD COLUMN tuition_installment_cents integer NOT NULL DEFAULT 45000,
  ADD COLUMN tuition_installments integer NOT NULL DEFAULT 16,
  ADD COLUMN summercamp_installment_cents integer NOT NULL DEFAULT 63400,
  ADD COLUMN summercamp_installments integer NOT NULL DEFAULT 16;