BEGIN;
-- Preserva os candidatos e hashes já cadastrados.
ALTER TABLE tbcandidato ADD COLUMN IF NOT EXISTS versao_sessao INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS tbrecuperacao_senha (
    candidato_id INTEGER PRIMARY KEY REFERENCES tbcandidato(id) ON DELETE CASCADE,
    solicitacao_id UUID NOT NULL UNIQUE,
    codigo_hmac VARCHAR(64) NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    tentativas INTEGER NOT NULL DEFAULT 0 CHECK (tentativas BETWEEN 0 AND 5),
    enviada BOOLEAN NOT NULL DEFAULT FALSE,
    invalidada BOOLEAN NOT NULL DEFAULT FALSE,
    consumida_em TIMESTAMPTZ
);
-- Chaves HMAC: não precisamos guardar CPF nem IP nesta tabela.
CREATE TABLE IF NOT EXISTS tblimite_recuperacao (
    chave VARCHAR(64) PRIMARY KEY,
    quantidade INTEGER NOT NULL,
    reinicia_em TIMESTAMPTZ NOT NULL
);
COMMIT;
