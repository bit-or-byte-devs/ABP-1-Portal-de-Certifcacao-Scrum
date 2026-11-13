-- Consolida as duas implementações 007 sem modificar seus arquivos históricos.
-- Repete com segurança em bancos que receberam qualquer uma delas ou ambas.
-- O schema inicial já contém a proteção final; esta migração atualiza instalações existentes.
BEGIN;
LOCK TABLE tbquestao, tbalternativa, tbresposta IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER IF EXISTS tg_questao_historico_imutavel ON tbquestao;
DROP TRIGGER IF EXISTS tg_alternativa_historico_imutavel ON tbalternativa;
DROP FUNCTION IF EXISTS fn_preservar_questao_com_historico();
DROP FUNCTION IF EXISTS fn_preservar_alternativas_com_historico();

CREATE OR REPLACE FUNCTION fn_proteger_questao_historica() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM tbresposta WHERE idquestao=OLD.id) THEN
        RAISE EXCEPTION 'Questão % possui tentativas. Preserve a versão antiga e crie um novo código de versão.', OLD.id
            USING ERRCODE='23514', CONSTRAINT='ck_questao_historica';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION fn_proteger_alternativa_historica() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    origem INTEGER;
    destino INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN RETURN NEW; END IF;
    IF TG_OP <> 'INSERT' THEN origem := OLD.idquestao; END IF;
    IF TG_OP <> 'DELETE' THEN destino := NEW.idquestao; END IF;
    -- Mesmo bloqueio da criação da tentativa; também cobre movimento de alternativa.
    PERFORM id FROM tbquestao WHERE id IN (origem, destino) ORDER BY id FOR UPDATE;
    IF EXISTS (SELECT 1 FROM tbresposta WHERE idquestao IN (origem, destino)) THEN
        RAISE EXCEPTION 'Alternativas de questão com tentativas são históricas. Crie um novo código de versão.'
            USING ERRCODE='23514', CONSTRAINT='ck_alternativa_historica';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION fn_travar_questao_tentativa() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF (NEW.idcertificacao, NEW.idtema, NEW.idquestao)
            IS DISTINCT FROM (OLD.idcertificacao, OLD.idtema, OLD.idquestao) THEN
            RAISE EXCEPTION 'Os vínculos históricos da tentativa não podem ser substituídos.'
                USING ERRCODE='23514', CONSTRAINT='ck_vinculo_historico';
        END IF;
        RETURN NEW;
    END IF;
    -- Serializa manutenção do catálogo com a primeira tentativa.
    PERFORM id FROM tbquestao WHERE id=NEW.idquestao FOR UPDATE;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_questao_historica ON tbquestao;
CREATE TRIGGER tg_questao_historica BEFORE UPDATE OR DELETE ON tbquestao
    FOR EACH ROW EXECUTE FUNCTION fn_proteger_questao_historica();

DROP TRIGGER IF EXISTS tg_alternativa_historica ON tbalternativa;
CREATE TRIGGER tg_alternativa_historica BEFORE INSERT OR UPDATE OR DELETE ON tbalternativa
    FOR EACH ROW EXECUTE FUNCTION fn_proteger_alternativa_historica();

DROP TRIGGER IF EXISTS tg_travar_questao_tentativa ON tbresposta;
CREATE TRIGGER tg_travar_questao_tentativa BEFORE INSERT OR UPDATE OF idcertificacao, idtema, idquestao ON tbresposta
    FOR EACH ROW EXECUTE FUNCTION fn_travar_questao_tentativa();
COMMIT;
