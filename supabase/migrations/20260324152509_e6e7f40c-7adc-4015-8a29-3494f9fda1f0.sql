DROP FUNCTION IF EXISTS public.get_admin_users();

CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, email text, last_sign_in_at timestamp with time zone, created_at timestamp with time zone, email_confirmed_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    au.id as user_id,
    au.email::text,
    au.last_sign_in_at,
    au.created_at,
    au.email_confirmed_at
  FROM auth.users au
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY au.created_at DESC;
$function$;