const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { carregar, importar, materiaisDoTema } = require('../scripts/importar-temas');

test('catálogo de estudos possui 12 temas, 70 seções e imagens válidas', () => {
    const temas = carregar();
    assert.equal(temas.length, 12);
    assert.equal(temas.reduce((total, tema) => total + tema.secoes.length, 0), 70);
    assert.equal(temas.flatMap(materiaisDoTema).length, 82);
    assert.equal(new Set(temas.flatMap(tema => tema.secoes.map(secao => secao.codigo))).size, 70);
});

test('validação rejeita catálogo incompleto e seção com código incorreto', t => {
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'temas-'));
    t.after(() => fs.rmSync(temporario, { recursive: true, force: true }));
    const origem = path.join(__dirname, '../../database/temas');
    for (const nome of fs.readdirSync(origem)) fs.copyFileSync(path.join(origem, nome), path.join(temporario, nome));
    fs.rmSync(path.join(temporario, 'tema-12.json'));
    assert.throws(() => carregar(temporario), /exatamente tema-01.json até tema-12.json/);
    fs.copyFileSync(path.join(origem, 'tema-12.json'), path.join(temporario, 'tema-12.json'));
    const arquivo = path.join(temporario, 'tema-01.json');
    const tema = JSON.parse(fs.readFileSync(arquivo)); tema.secoes[0].codigo = 'incorreto';
    fs.writeFileSync(arquivo, JSON.stringify(tema));
    assert.throws(() => carregar(temporario), /Seção inválida/);
});

test('importação é repetível e atualiza conteúdo mantendo os códigos', async () => {
    const temas = carregar();
    const materiais = new Map(), imagens = new Map(), vinculos = new Set(), temasIds = new Map();
    let proximoMaterial = 1, proximaImagem = 1;
    const db = { async query(sql, p = []) {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql.includes('pg_advisory')) return { rows: [] };
        if (sql === 'ROLLBACK') return { rows: [] };
        if (sql.includes('INSERT INTO tbtema')) {
            if (!temasIds.has(p[2])) temasIds.set(p[2], p[2] * 10);
            return { rows: [{ id: temasIds.get(p[2]) }] };
        }
        if (sql.includes('SELECT id, hash_origem FROM tbmaterial')) {
            const item = materiais.get(p[0]); return { rows: item ? [{ id: item.id, hash_origem: item.hash }] : [] };
        }
        if (sql.includes('INSERT INTO tbmaterial') && !sql.includes('tbmaterial_por_imagem')) {
            const item = { id: proximoMaterial++, hash: p[5] }; materiais.set(p[4], item);
            return { rows: [{ id: item.id }] };
        }
        if (sql.includes('UPDATE tbmaterial SET')) {
            const item = [...materiais.values()].find(material => material.id === p[7]); item.hash = p[4]; return { rows: [] };
        }
        if (sql.startsWith('DELETE FROM tbmaterial_por_imagem WHERE')) {
            for (const chave of [...vinculos]) if (chave.startsWith(p[0] + ':')) vinculos.delete(chave);
            return { rows: [] };
        }
        if (sql.includes('SELECT id FROM tbimagem')) {
            const chave = JSON.stringify(p); return { rows: imagens.has(chave) ? [{ id: imagens.get(chave) }] : [] };
        }
        if (sql.includes('INSERT INTO tbimagem')) {
            const chave = JSON.stringify(p), id = proximaImagem++; imagens.set(chave, id); return { rows: [{ id }] };
        }
        if (sql.includes('INSERT INTO tbmaterial_por_imagem')) {
            vinculos.add(`${p[0]}:${p[1]}`); return { rows: [] };
        }
        if (sql.includes('DELETE FROM tbmaterial_por_imagem mpi USING')) return { rows: [] };
        if (sql.includes('DELETE FROM tbmaterial m USING')) return { rows: [], rowCount: 0 };
        throw new Error('SQL inesperado: ' + sql);
    }};
    assert.deepEqual(await importar(db, temas), { inseridos: 82, atualizados: 0, existentes: 0, removidos: 0 });
    assert.deepEqual(await importar(db, temas), { inseridos: 0, atualizados: 0, existentes: 82, removidos: 0 });
    assert.equal(imagens.size, 26); assert.equal(vinculos.size, 26);
    const alterados = structuredClone(temas);
    alterados[0].secoes[0].blocos.push({ tipo: 'paragrafo', conteudo: 'Revisão controlada.' });
    assert.deepEqual(await importar(db, alterados), { inseridos: 0, atualizados: 1, existentes: 81, removidos: 0 });
});
