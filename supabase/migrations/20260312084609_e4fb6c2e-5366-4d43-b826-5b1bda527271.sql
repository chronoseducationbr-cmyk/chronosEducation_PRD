ALTER TABLE public.enrollments 
  ADD COLUMN tuition_start_date date DEFAULT NULL,
  ADD COLUMN summercamp_start_date date DEFAULT NULL;