-- Preserva o conteúdo das questões que já fazem parte do histórico de tentativas.
-- Correções e mudanças devem ser cadastradas com um novo código de versão.
BEGIN;

CREATE OR REPLACE FUNCTION fn_preservar_questao_com_historico() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.idtema IS NOT DISTINCT FROM NEW.idtema
        AND OLD.codigo_origem IS NOT DISTINCT FROM NEW.codigo_origem
        AND OLD.enunciado IS NOT DISTINCT FROM NEW.enunciado
        AND OLD.justificativa IS NOT DISTINCT FROM NEW.justificativa THEN
        RETURN NEW;
    END IF;

    IF EXISTS (SELECT 1 FROM tbresposta WHERE idquestao=OLD.id) THEN
        RAISE EXCEPTION 'Questão % já possui tentativa; cadastre uma nova versão.', OLD.id
            USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_questao_historico_imutavel ON tbquestao;
CREATE TRIGGER tg_questao_historico_imutavel
    BEFORE UPDATE OF idtema, codigo_origem, enunciado, justificativa ON tbquestao
    FOR EACH ROW EXECUTE FUNCTION fn_preservar_questao_com_historico();

CREATE OR REPLACE FUNCTION fn_preservar_alternativas_com_historico() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    questoes INTEGER[];
    questao INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.idquestao IS NOT DISTINCT FROM NEW.idquestao
            AND OLD.letra IS NOT DISTINCT FROM NEW.letra
            AND OLD.texto IS NOT DISTINCT FROM NEW.texto
            AND OLD.correta IS NOT DISTINCT FROM NEW.correta THEN
            RETURN NEW;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        questoes := ARRAY[NEW.idquestao];
    ELSIF TG_OP = 'DELETE' THEN
        questoes := ARRAY[OLD.idquestao];
    ELSE
        questoes := ARRAY[OLD.idquestao, NEW.idquestao];
    END IF;

    FOR questao IN
        SELECT DISTINCT referencia.idquestao
        FROM unnest(questoes) AS referencia(idquestao)
        ORDER BY referencia.idquestao
    LOOP
        PERFORM 1 FROM tbquestao WHERE id=questao FOR UPDATE;
        IF EXISTS (SELECT 1 FROM tbresposta WHERE idquestao=questao) THEN
            RAISE EXCEPTION 'Questão % já possui tentativa; cadastre uma nova versão.', questao
                USING ERRCODE = '55000';
        END IF;
    END LOOP;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_alternativa_historico_imutavel ON tbalternativa;
CREATE TRIGGER tg_alternativa_historico_imutavel
    BEFORE INSERT OR UPDATE OR DELETE ON tbalternativa
    FOR EACH ROW EXECUTE FUNCTION fn_preservar_alternativas_com_historico();

COMMIT;