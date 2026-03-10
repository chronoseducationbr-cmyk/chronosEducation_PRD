
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id as user_id,
    au.email::text,
    au.last_sign_in_at,
    au.created_at
  FROM auth.users au
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY au.created_at DESC;
$$;
