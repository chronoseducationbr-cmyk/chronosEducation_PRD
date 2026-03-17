
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  contract_enabled boolean NOT NULL DEFAULT true,
  default_inscription_fee_cents integer NOT NULL DEFAULT 80000,
  default_tuition_installment_cents integer NOT NULL DEFAULT 45000,
  default_tuition_installments integer NOT NULL DEFAULT 16,
  default_summercamp_installment_cents integer NOT NULL DEFAULT 0,
  default_summercamp_installments integer NOT NULL DEFAULT 6,
  contract_text text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.app_settings (id, contract_text) VALUES (1, '');
