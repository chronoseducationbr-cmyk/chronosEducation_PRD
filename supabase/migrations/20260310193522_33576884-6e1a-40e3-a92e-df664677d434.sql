
ALTER TABLE public.installments
  ADD COLUMN amount_cents integer NOT NULL DEFAULT 0;
