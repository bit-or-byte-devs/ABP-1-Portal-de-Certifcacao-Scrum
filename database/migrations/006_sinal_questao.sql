-- Registra o último sinal da página aberta em cada questão (US22, RF14).
-- Sem sinal além do limite, o servidor encerra a questão como interrompida.
-- Pode ser executada mais de uma vez.
BEGIN;

ALTER TABLE tbresposta ADD COLUMN IF NOT EXISTS data_hora_ultimo_sinal TIMESTAMPTZ;

-- Linhas anteriores à migração: o único sinal conhecido é a própria exibição.
UPDATE tbresposta SET data_hora_ultimo_sinal = data_hora_exibicao
WHERE data_hora_ultimo_sinal IS NULL;

ALTER TABLE tbresposta ALTER COLUMN data_hora_ultimo_sinal SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tbresposta ALTER COLUMN data_hora_ultimo_sinal SET NOT NULL;

ALTER TABLE tbresposta DROP CONSTRAINT IF EXISTS ck_resposta_ultimo_sinal;
ALTER TABLE tbresposta ADD CONSTRAINT ck_resposta_ultimo_sinal
    CHECK (data_hora_ultimo_sinal >= data_hora_exibicao);

COMMIT;
