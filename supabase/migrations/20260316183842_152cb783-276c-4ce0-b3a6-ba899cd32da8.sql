CREATE OR REPLACE FUNCTION public.get_admin_invitations()
 RETURNS TABLE(id uuid, email text, invite_code text, status text, created_at timestamp with time zone, expires_at timestamp with time zone, used_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT i.id, i.email, i.invite_code, i.status, i.created_at, i.expires_at, i.used_at
  FROM public.invitations i
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
    AND i.status <> 'cancelled'
  ORDER BY i.created_at DESC;
$$;