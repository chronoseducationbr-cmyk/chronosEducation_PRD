UPDATE public.app_settings
SET contract_text_summercamp = REPLACE(
      contract_text_summercamp,
      '[dataNascimentoAluno], [nacionalidadeAluno]',
      '[dataNascimentoAluno], de [nacionalidadeAluno]'
    ),
    updated_at = now()
WHERE id = 1
  AND contract_text_summercamp LIKE '%[dataNascimentoAluno], [nacionalidadeAluno]%';