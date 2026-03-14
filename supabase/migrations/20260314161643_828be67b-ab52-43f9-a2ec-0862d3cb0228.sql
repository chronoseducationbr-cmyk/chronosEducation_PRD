
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id)
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON public.quiz_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON public.quiz_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz results"
  ON public.quiz_results FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
