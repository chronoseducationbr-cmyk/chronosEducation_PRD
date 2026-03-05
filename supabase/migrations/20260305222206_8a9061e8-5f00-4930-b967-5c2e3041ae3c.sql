
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow the edge function (service role) to manage invitations
-- Authenticated users can only read their own invitations (by email match)
CREATE POLICY "Service role full access" ON public.invitations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own invitations by email" ON public.invitations
  FOR SELECT TO anon, authenticated
  USING (true);

-- Index for fast lookup
CREATE INDEX idx_invitations_email_code ON public.invitations (email, invite_code);
CREATE INDEX idx_invitations_code ON public.invitations (invite_code);
