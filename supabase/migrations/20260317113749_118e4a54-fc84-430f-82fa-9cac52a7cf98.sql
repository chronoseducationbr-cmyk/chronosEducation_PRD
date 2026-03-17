
-- Create quiz_tests table
CREATE TABLE public.quiz_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_tests ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated users can view quiz tests"
  ON public.quiz_tests FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage quiz tests"
  ON public.quiz_tests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add quiz_test_id to enrollments
ALTER TABLE public.enrollments
  ADD COLUMN quiz_test_id uuid REFERENCES public.quiz_tests(id) DEFAULT NULL;

-- Insert the first test (active by default)
INSERT INTO public.quiz_tests (name, slug, is_active) VALUES ('Teste 1', 'test1', true);
