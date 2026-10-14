-- Instalação inicial: execute em um banco vazio.
-- Para atualizar um banco existente, use database/migrations/001_recuperacao_senha.sql.
BEGIN;

-- 1. Candidatos
CREATE TABLE tbcandidato (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha_hash TEXT NOT NULL,
    versao_sessao INTEGER NOT NULL DEFAULT 0,
    data_cadastro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_aceite_termos TIMESTAMPTZ,

    CONSTRAINT ck_candidato_cpf
        CHECK (cpf ~ '^[0-9]{11}$')
);

-- 2. Temas da certificação
CREATE TABLE tbtema (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    ordem SMALLINT NOT NULL UNIQUE,

    CONSTRAINT ck_tema_ordem
        CHECK (ordem BETWEEN 1 AND 12)
);

-- 3. Imagens
-- Armazenamos o caminho ou URL; não o arquivo da imagem.
CREATE TABLE tbimagem (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    arquivo_ou_url TEXT NOT NULL,
    texto_alternativo TEXT NOT NULL,
    credito TEXT
);

-- 4. Materiais da área de estudos
CREATE TABLE tbmaterial (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idtema INTEGER NOT NULL REFERENCES tbtema(id),
    titulo VARCHAR(200) NOT NULL,
    conteudo_ou_url TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    ordem INTEGER NOT NULL,

    CONSTRAINT ck_material_ordem CHECK (ordem > 0)
);

-- Um material pode utilizar várias imagens.
CREATE TABLE tbmaterial_por_imagem (
    idmaterial INTEGER NOT NULL REFERENCES tbmaterial(id),
    idimagem INTEGER NOT NULL REFERENCES tbimagem(id),

    PRIMARY KEY (idmaterial, idimagem)
);

-- 5. Questões
CREATE TABLE tbquestao (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idtema INTEGER NOT NULL REFERENCES tbtema(id),
    idimagem INTEGER NOT NULL REFERENCES tbimagem(id),
    enunciado TEXT NOT NULL,
    justificativa TEXT NOT NULL,

    -- Necessária para a referência composta de tbresposta.
    CONSTRAINT uq_questao_tema UNIQUE (id, idtema)
);

-- 6. Alternativas
CREATE TABLE tbalternativa (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idquestao INTEGER NOT NULL REFERENCES tbquestao(id),
    letra CHAR(1) NOT NULL,
    texto TEXT NOT NULL,
    correta BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT ck_alternativa_letra
        CHECK (letra IN ('A', 'B', 'C', 'D')),

    CONSTRAINT uq_alternativa_letra
        UNIQUE (idquestao, letra),

    -- Necessária para a referência composta de tbresposta.
    CONSTRAINT uq_alternativa_questao
        UNIQUE (id, idquestao)
);

-- Impede duas alternativas corretas na mesma questão.
CREATE UNIQUE INDEX uq_alternativa_correta
    ON tbalternativa (idquestao)
    WHERE correta = TRUE;

-- 7. Certificação do candidato
-- Neste MVP, cada candidato possui uma certificação.
CREATE TABLE tbcertificacao (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idcandidato INTEGER NOT NULL UNIQUE
        REFERENCES tbcandidato(id),

    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'em_andamento',

    -- Nota final e percentual usam a escala de 0 a 100.
    nota_final NUMERIC(5,2),
    percentual_acertos NUMERIC(5,2),
    total_acertos SMALLINT,

    CONSTRAINT ck_certificacao_status
        CHECK (status IN ('em_andamento', 'pausada', 'concluida')),

    CONSTRAINT ck_certificacao_nota
        CHECK (nota_final BETWEEN 0 AND 100),

    CONSTRAINT ck_certificacao_percentual
        CHECK (percentual_acertos BETWEEN 0 AND 100),

    CONSTRAINT ck_certificacao_acertos
        CHECK (total_acertos BETWEEN 0 AND 12),

    CONSTRAINT ck_certificacao_datas
        CHECK (data_conclusao >= data_inicio)
);

-- 8. Respostas e histórico
CREATE TABLE tbresposta (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idcertificacao INTEGER NOT NULL REFERENCES tbcertificacao(id),
    idtema INTEGER NOT NULL REFERENCES tbtema(id),
    idquestao INTEGER NOT NULL,
    idalternativa INTEGER,

    data_hora_exibicao TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    data_hora_resposta TIMESTAMPTZ,
    data_hora_encerramento TIMESTAMPTZ,

    situacao VARCHAR(20) NOT NULL DEFAULT 'em_andamento',
    acertou BOOLEAN,

    -- Uma única questão por tema em cada certificação.
    CONSTRAINT uq_resposta_certificacao_tema
        UNIQUE (idcertificacao, idtema),

    -- Garante que a questão pertence ao tema informado.
    CONSTRAINT fk_resposta_questao_tema
        FOREIGN KEY (idquestao, idtema)
        REFERENCES tbquestao (id, idtema),

    -- Garante que a alternativa pertence à questão apresentada.
    -- idalternativa pode ser NULL quando não houver escolha.
    CONSTRAINT fk_resposta_alternativa_questao
        FOREIGN KEY (idalternativa, idquestao)
        REFERENCES tbalternativa (id, idquestao),

    CONSTRAINT ck_resposta_situacao
        CHECK (
            situacao IN (
                'em_andamento',
                'respondida',
                'tempo_esgotado',
                'interrompida'
            )
        ),

    CONSTRAINT ck_resposta_estado
        CHECK (
            (
                situacao = 'em_andamento'
                AND idalternativa IS NULL
                AND data_hora_resposta IS NULL
                AND data_hora_encerramento IS NULL
                AND acertou IS NULL
            )
            OR
            (
                situacao = 'respondida'
                AND idalternativa IS NOT NULL
                AND data_hora_resposta IS NOT NULL
                AND data_hora_encerramento IS NOT NULL
                AND acertou IS NOT NULL
            )
            OR
            (
                situacao IN ('tempo_esgotado', 'interrompida')
                AND idalternativa IS NULL
                AND data_hora_resposta IS NULL
                AND data_hora_encerramento IS NOT NULL
                AND acertou IS FALSE
            )
        ),

    CONSTRAINT ck_resposta_datas
        CHECK (
            (data_hora_resposta IS NULL
             OR data_hora_resposta >= data_hora_exibicao)
            AND
            (data_hora_encerramento IS NULL
             OR data_hora_encerramento >= data_hora_exibicao)
        )
);

-- 9. Certificados
-- Preserva os dados existentes no momento da emissão.
CREATE TABLE tbcertificado (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idcertificacao INTEGER NOT NULL UNIQUE
        REFERENCES tbcertificacao(id),

    codigo_validacao VARCHAR(64) NOT NULL UNIQUE,
    data_hora_emissao TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    nome_completo_emitido VARCHAR(150) NOT NULL,
    cpf_emitido VARCHAR(11) NOT NULL,
    email_emitido VARCHAR(254) NOT NULL,
    nota_final_emitida NUMERIC(5,2) NOT NULL,
    percentual_acertos_emitido NUMERIC(5,2) NOT NULL,

    CONSTRAINT ck_certificado_nota
        CHECK (nota_final_emitida BETWEEN 0 AND 100),

    CONSTRAINT ck_certificado_aprovacao
        CHECK (percentual_acertos_emitido BETWEEN 65 AND 100)
);

-- 10. Recuperação de senha e controle de tentativas
CREATE TABLE tbrecuperacao_senha (
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
CREATE TABLE tblimite_recuperacao (
    chave VARCHAR(64) PRIMARY KEY,
    quantidade INTEGER NOT NULL,
    reinicia_em TIMESTAMPTZ NOT NULL
);

-- Índices para consultas pelos relacionamentos.
CREATE INDEX idx_material_tema ON tbmaterial(idtema);
CREATE INDEX idx_material_imagem ON tbmaterial_por_imagem(idimagem);
CREATE INDEX idx_questao_tema ON tbquestao(idtema);
CREATE INDEX idx_questao_imagem ON tbquestao(idimagem);
CREATE INDEX idx_resposta_questao ON tbresposta(idquestao);
CREATE INDEX idx_resposta_alternativa ON tbresposta(idalternativa);

COMMIT;