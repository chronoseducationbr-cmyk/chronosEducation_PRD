
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  referred_enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  referrer_student_email text NOT NULL,
  referred_student_email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referrer_enrollment_id, referred_enrollment_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE (e.id = referrals.referrer_enrollment_id OR e.id = referrals.referred_enrollment_id)
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert referrals for own enrollments" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = referrals.referred_enrollment_id
      AND e.user_id = auth.uid()
    )
  );
