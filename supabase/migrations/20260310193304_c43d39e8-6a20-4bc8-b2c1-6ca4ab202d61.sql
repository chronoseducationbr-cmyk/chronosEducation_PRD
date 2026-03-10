
ALTER TABLE public.enrollments
  ADD COLUMN contract_url text,
  ADD COLUMN contract_sent_at timestamp with time zone,
  ADD COLUMN contract_signed_at timestamp with time zone;

-- Storage bucket for contracts
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', true);

-- Authenticated users can read their contracts
CREATE POLICY "Authenticated users can read contracts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'contracts');

-- Admins can manage contracts storage
CREATE POLICY "Admins can manage contracts storage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'contracts' AND public.has_role(auth.uid(), 'admin'));
