ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school text;

DROP FUNCTION IF EXISTS public.get_admin_invitations();

CREATE OR REPLACE FUNCTION public.get_admin_invitations()
 RETURNS TABLE(id uuid, email text, invite_code text, status text, created_at timestamp with time zone, expires_at timestamp with time zone, used_at timestamp with time zone, school text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT i.id, i.email, i.invite_code, i.status, i.created_at, i.expires_at, i.used_at, i.school
  FROM public.invitations i
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
    AND i.status <> 'cancelled'
  ORDER BY i.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_school text;
BEGIN
  SELECT school INTO invite_school
  FROM public.invitations
  WHERE lower(email) = lower(COALESCE(NEW.email, ''))
    AND school IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO public.profiles (user_id, full_name, email, school)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    invite_school
  );
  RETURN NEW;
END;
$function$;