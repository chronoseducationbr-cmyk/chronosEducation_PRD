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
    'inscription_fee',
    1,
    NEW.inscription_fee_cents,
    (NEW.created_at AT TIME ZONE 'UTC')::date,
    'pending'
  );
  RETURN NEW;
END;
$$;