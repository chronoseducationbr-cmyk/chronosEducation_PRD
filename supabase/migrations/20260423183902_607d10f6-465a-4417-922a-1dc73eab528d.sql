ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_nationality text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS student_cpf text;