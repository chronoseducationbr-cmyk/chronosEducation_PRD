
-- Allow admins to delete enrollments
CREATE POLICY "Admins can delete enrollments"
ON public.enrollments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete quiz_results
CREATE POLICY "Admins can delete quiz results"
ON public.quiz_results
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
