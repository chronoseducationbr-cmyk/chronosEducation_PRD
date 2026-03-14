-- Remove the user INSERT policy (system handles it via trigger)
DROP POLICY IF EXISTS "Users can insert installments for own enrollments" ON public.installments;

-- Create trigger function to auto-create inscription installment
CREATE OR REPLACE FUNCTION public.create_inscription_installment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.installments (
    enrollment_id,
    type,
    installment_number,
    amount_cents,
    due_date,
    status
  ) VALUES (
    NEW.id,
    'inscription',
    1,
    NEW.inscription_fee_cents,
    (NEW.created_at AT TIME ZONE 'UTC')::date,
    'pending'
  );
  RETURN NEW;
END;
$$;

-- Attach trigger to enrollments table
CREATE TRIGGER trg_create_inscription_installment
AFTER INSERT ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.create_inscription_installment();