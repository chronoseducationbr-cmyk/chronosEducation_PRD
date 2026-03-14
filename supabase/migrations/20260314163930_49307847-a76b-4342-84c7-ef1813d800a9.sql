CREATE POLICY "Users can insert installments for own enrollments"
ON public.installments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = installments.enrollment_id
      AND e.user_id = auth.uid()
  )
);