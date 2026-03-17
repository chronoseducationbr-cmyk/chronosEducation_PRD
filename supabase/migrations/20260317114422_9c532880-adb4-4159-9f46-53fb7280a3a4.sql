
-- Add score columns for weighted points
ALTER TABLE public.quiz_results ADD COLUMN score_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.quiz_results ADD COLUMN max_points integer NOT NULL DEFAULT 0;
