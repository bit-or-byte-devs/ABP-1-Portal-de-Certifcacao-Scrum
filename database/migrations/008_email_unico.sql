-- E-mail único por candidato, sem diferenciar maiúsculas de minúsculas (US42, #51).
-- Se houver e-mails repetidos, aborta sem alterar nenhum dado.
-- Pode ser executada mais de uma vez.
BEGIN;

DO $$
DECLARE
    emails_repetidos INTEGER;
    contas_envolvidas INTEGER;
BEGIN
    SELECT count(*), COALESCE(sum(total), 0)
      INTO emails_repetidos, contas_envolvidas
      FROM (SELECT count(*) AS total FROM tbcandidato
            GROUP BY lower(trim(email)) HAVING count(*) > 1) AS repetidos;
    IF emails_repetidos > 0 THEN
        RAISE EXCEPTION 'Existem % e-mail(s) repetido(s) em % conta(s); nenhum dado foi alterado. Liste com: SELECT lower(trim(email)) AS email, array_agg(id ORDER BY id) AS ids FROM tbcandidato GROUP BY 1 HAVING count(*) > 1; Resolva as duplicatas manualmente e execute a preparação novamente.',
            emails_repetidos, contas_envolvidas;
    END IF;
END $$;

-- Sem duplicatas, a normalização não gera conflito.
UPDATE tbcandidato SET email = lower(trim(email))
WHERE email <> lower(trim(email));

CREATE UNIQUE INDEX IF NOT EXISTS uq_candidato_email ON tbcandidato (lower(email));

COMMIT;
