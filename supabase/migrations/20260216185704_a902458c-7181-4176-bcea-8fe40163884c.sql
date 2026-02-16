
-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_birth_date date,
  ADD COLUMN IF NOT EXISTS student_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_graduation_year integer,
  ADD COLUMN IF NOT EXISTS student_photo_url text DEFAULT '';

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update student photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to student photos
CREATE POLICY "Student photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete student photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
