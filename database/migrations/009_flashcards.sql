-- Catálogo de flashcards e progresso do candidato (repetição espaçada em 3 caixas).
-- Não altera questões, alternativas nem respostas. Pode ser executada mais de uma vez.
BEGIN;

CREATE TABLE IF NOT EXISTS tbflashcard (
    id SERIAL PRIMARY KEY,
    idtema INTEGER NOT NULL REFERENCES tbtema(id),
    idimagem INTEGER REFERENCES tbimagem(id),
    frente TEXT NOT NULL,
    verso TEXT NOT NULL,
    explicacao TEXT NOT NULL,
    fonte VARCHAR(255) NOT NULL,
    codigo_origem VARCHAR(100) NOT NULL,
    hash_origem VARCHAR(64) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_flashcard_codigo_origem UNIQUE (codigo_origem),
    CONSTRAINT ck_flashcard_frente CHECK (btrim(frente) <> ''),
    CONSTRAINT ck_flashcard_verso CHECK (btrim(verso) <> ''),
    CONSTRAINT ck_flashcard_explicacao CHECK (btrim(explicacao) <> ''),
    CONSTRAINT ck_flashcard_fonte CHECK (btrim(fonte) <> '')
);

CREATE INDEX IF NOT EXISTS idx_flashcard_tema_ativo ON tbflashcard(idtema) WHERE ativo;

CREATE TABLE IF NOT EXISTS tbprogresso_flashcard (
    idcandidato INTEGER NOT NULL REFERENCES tbcandidato(id) ON DELETE CASCADE,
    idflashcard INTEGER NOT NULL REFERENCES tbflashcard(id),
    caixa SMALLINT NOT NULL,
    acertos INTEGER NOT NULL DEFAULT 0,
    erros INTEGER NOT NULL DEFAULT 0,
    ultima_revisao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (idcandidato, idflashcard),
    CONSTRAINT ck_progresso_flashcard_caixa CHECK (caixa BETWEEN 1 AND 3),
    CONSTRAINT ck_progresso_flashcard_acertos CHECK (acertos >= 0),
    CONSTRAINT ck_progresso_flashcard_erros CHECK (erros >= 0)
);

CREATE INDEX IF NOT EXISTS idx_progresso_flashcard_flashcard ON tbprogresso_flashcard(idflashcard);

COMMIT;
