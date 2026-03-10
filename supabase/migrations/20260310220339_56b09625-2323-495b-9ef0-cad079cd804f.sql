
CREATE OR REPLACE FUNCTION public.get_admin_invitations()
RETURNS TABLE (
  id uuid,
  email text,
  invite_code text,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.invite_code, i.status, i.created_at, i.expires_at, i.used_at
  FROM public.invitations i
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY i.created_at DESC;
$$;
