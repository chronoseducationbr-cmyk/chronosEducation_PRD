
-- Create installments table
CREATE TABLE public.installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('inscription_fee', 'tuition', 'summercamp')),
  installment_number integer NOT NULL DEFAULT 1,
  due_date date,
  paid_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  boleto_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- Parents can view installments for their own enrollments
CREATE POLICY "Users can view own installments"
  ON public.installments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = installments.enrollment_id
        AND enrollments.user_id = auth.uid()
    )
  );

-- Service role can do everything (admin management)
CREATE POLICY "Service role full access on installments"
  ON public.installments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for boletos
INSERT INTO storage.buckets (id, name, public) VALUES ('boletos', 'boletos', true);

-- Storage RLS: anyone authenticated can read boletos
CREATE POLICY "Authenticated users can read boletos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'boletos');

-- Service role can upload boletos
CREATE POLICY "Service role can manage boletos"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'boletos')
  WITH CHECK (bucket_id = 'boletos');
