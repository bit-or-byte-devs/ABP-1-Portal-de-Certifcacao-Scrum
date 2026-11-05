-- Estrutura a carga dos materiais de estudo e preserva o progresso já registrado.
BEGIN;

ALTER TABLE tbmaterial ALTER COLUMN conteudo_ou_url DROP NOT NULL;
ALTER TABLE tbmaterial ADD COLUMN IF NOT EXISTS codigo_origem VARCHAR(100);
ALTER TABLE tbmaterial ADD COLUMN IF NOT EXISTS hash_origem VARCHAR(64);
ALTER TABLE tbmaterial ADD COLUMN IF NOT EXISTS nivel SMALLINT;
ALTER TABLE tbmaterial ADD COLUMN IF NOT EXISTS conteudo JSONB;
ALTER TABLE tbmaterial DROP CONSTRAINT IF EXISTS ck_material_ordem;
ALTER TABLE tbmaterial ADD CONSTRAINT ck_material_ordem CHECK (ordem >= 0);
ALTER TABLE tbmaterial DROP CONSTRAINT IF EXISTS ck_material_nivel;
ALTER TABLE tbmaterial ADD CONSTRAINT ck_material_nivel CHECK (nivel IS NULL OR nivel IN (3, 4));

CREATE UNIQUE INDEX IF NOT EXISTS uq_material_codigo_origem
    ON tbmaterial(codigo_origem);
DROP INDEX IF EXISTS uq_material_tema_ordem_importado;

ALTER TABLE tbprogresso_estudo
    ADD COLUMN IF NOT EXISTS secoes VARCHAR(100)[] NOT NULL DEFAULT '{}';

-- Converte os índices antigos para os códigos estáveis usados pelos JSONs.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'tbprogresso_estudo' AND column_name = 'subtitulos'
    ) THEN
        EXECUTE $sql$
            UPDATE tbprogresso_estudo p SET secoes = COALESCE((
                SELECT array_agg(
                    'tema-' || lpad(t.ordem::text, 2, '0') || '-s' ||
                    lpad((item.indice + 1)::text, 2, '0') ORDER BY item.indice
                )
                FROM tbtema t, unnest(p.subtitulos) AS item(indice)
                WHERE t.id = p.idtema AND item.indice >= 0
            ), '{}'::varchar[])
            WHERE cardinality(p.secoes) = 0
        $sql$;
        ALTER TABLE tbprogresso_estudo DROP COLUMN subtitulos;
    END IF;
END $$;

COMMIT;
