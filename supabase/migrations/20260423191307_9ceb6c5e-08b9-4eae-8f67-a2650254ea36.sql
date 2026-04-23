UPDATE public.app_settings
SET contract_text = contract_text || E'\n\nASSINATURAS\n\nSão Paulo, [data].\n\nCONTRATANTE: ___________________________________________\n\nCONTRATADA: ____________________________________________\n\nALUNO (se aplicável): _____________________________________',
    updated_at = now()
WHERE id = 1
  AND contract_text NOT LIKE '%ASSINATURAS%';