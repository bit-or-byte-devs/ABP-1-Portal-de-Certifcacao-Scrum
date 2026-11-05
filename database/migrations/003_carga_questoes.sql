-- Não modifica questões existentes nem suas respostas.
BEGIN;
ALTER TABLE tbquestao ALTER COLUMN idimagem DROP NOT NULL;
ALTER TABLE tbquestao ADD COLUMN IF NOT EXISTS codigo_origem VARCHAR(100);
ALTER TABLE tbquestao ADD COLUMN IF NOT EXISTS hash_origem VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS uq_questao_codigo_origem ON tbquestao(codigo_origem);
COMMIT;
