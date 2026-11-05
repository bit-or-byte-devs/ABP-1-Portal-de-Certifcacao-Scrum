-- Garante que toda questão tenha exatamente 4 alternativas e 1 correta (US14, RF08).
-- Pode ser executada mais de uma vez. Não corrige dados: aborta se houver questão inválida.
BEGIN;

-- Recusa aplicar a regra sobre questões que já a violam.
DO $$
DECLARE
    invalidas TEXT;
BEGIN
    SELECT string_agg(format('%s (%s)', id, coalesce(codigo_origem, 'sem código')), ', ' ORDER BY id)
    INTO invalidas
    FROM (
        -- LEFT JOIN inclui questões sem nenhuma alternativa.
        SELECT q.id, q.codigo_origem
        FROM tbquestao q
        LEFT JOIN tbalternativa a ON a.idquestao = q.id
        GROUP BY q.id, q.codigo_origem
        HAVING count(a.id) <> 4 OR count(a.id) FILTER (WHERE a.correta) <> 1
    ) questoes_invalidas;

    IF invalidas IS NOT NULL THEN
        RAISE EXCEPTION 'Questões sem exatamente 4 alternativas e 1 correta: %', invalidas;
    END IF;
END $$;

-- 6.1 Validação das alternativas da questão
-- Verificada no COMMIT, permitindo inserir a questão e depois as 4 alternativas.
CREATE OR REPLACE FUNCTION fn_validar_alternativas_questao() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    questoes INTEGER[];
    questao INTEGER;
    total INTEGER;
    corretas INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'tbquestao' THEN
        questoes := ARRAY[NEW.id];
    ELSIF TG_OP = 'INSERT' THEN
        questoes := ARRAY[NEW.idquestao];
    ELSIF TG_OP = 'DELETE' OR OLD.idquestao = NEW.idquestao THEN
        questoes := ARRAY[OLD.idquestao];
    ELSE
        -- Alternativa movida de questão: valida a de origem e a de destino.
        questoes := ARRAY[OLD.idquestao, NEW.idquestao];
    END IF;

    FOREACH questao IN ARRAY questoes LOOP
        -- Trava a questão para que transações concorrentes não passem juntas.
        PERFORM 1 FROM tbquestao WHERE id = questao FOR UPDATE;
        -- Questão apagada na mesma transação: nada a validar.
        CONTINUE WHEN NOT FOUND;

        SELECT count(*), count(*) FILTER (WHERE correta)
        INTO total, corretas
        FROM tbalternativa
        WHERE idquestao = questao;

        IF total <> 4 OR corretas <> 1 THEN
            RAISE EXCEPTION 'A questão % deve ter exatamente 4 alternativas e 1 correta (tem % e %).',
                questao, total, corretas
                USING ERRCODE = '23514', CONSTRAINT = 'ck_questao_alternativas';
        END IF;
    END LOOP;

    RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS tg_alternativas_questao ON tbalternativa;
CREATE CONSTRAINT TRIGGER tg_alternativas_questao
    AFTER INSERT OR DELETE OR UPDATE OF idquestao, correta ON tbalternativa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_validar_alternativas_questao();

-- Impede questão sem nenhuma alternativa.
DROP TRIGGER IF EXISTS tg_questao_alternativas ON tbquestao;
CREATE CONSTRAINT TRIGGER tg_questao_alternativas
    AFTER INSERT ON tbquestao
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_validar_alternativas_questao();

COMMIT;
